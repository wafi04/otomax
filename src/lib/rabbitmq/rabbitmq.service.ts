import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { MessageLog } from 'src/types/queue';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private messageLogs: MessageLog[] = []; // In-memory storage (use Redis/DB for production)
  private processedCount = 0;
  private failedCount = 0;

  async onModuleInit() {
    try {
      // Connect to RabbitMQ
      this.connection = await amqp.connect(
        process.env.RABBITMQ_URL || 'amqp://wafi:rahasia123@localhost:5672',
      );

      // Create channel
      this.channel = await this.connection.createChannel();

      // Assert queue exists
      await this.channel.assertQueue('my_queue', { durable: false });

      this.logger.log('✅ Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('📴 RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('❌ Error closing RabbitMQ:', error);
    }
  }

  // Send message to queue (simple publish)
  async sendToQueue(queue: string, message: any): Promise<string> {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const messageWithId = { ...message, _messageId: messageId };
      const messageBuffer = Buffer.from(JSON.stringify(messageWithId));

      const sent = this.channel.sendToQueue(queue, messageBuffer, {
        persistent: true, // Make message durable
      });

      // Log sent message
      this.messageLogs.push({
        id: messageId,
        queue,
        message: messageWithId,
        status: 'sent',
        sentAt: new Date(),
      });

      // Keep only last 100 messages to prevent memory leak
      if (this.messageLogs.length > 100) {
        this.messageLogs = this.messageLogs.slice(-100);
      }

      this.logger.log(`📤 Message sent to queue ${queue}:`, messageWithId);
      return messageId;
    } catch (error) {
      this.logger.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // Consume messages from queue (simple consumer)
  async consumeFromQueue(
    queue: string,
    callback: (message: any) => Promise<void> | void,
  ): Promise<void> {
    try {
      // Wait for connection and channel to be ready
      if (!this.connection || !this.channel) {
        this.logger.warn('⏳ RabbitMQ not ready, waiting...');
        await this.waitForConnection();
      }

      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          const startTime = Date.now();
          const content = JSON.parse(msg.content.toString());
          const messageId = content._messageId;

          this.logger.log(`📩 Received from queue ${queue}:`, content);

          // Update status to processing
          this.updateMessageStatus(messageId, 'processing');

          try {
            // Process message
            await callback(content);

            const processingTime = Date.now() - startTime;

            // Update status to processed
            this.updateMessageStatus(
              messageId,
              'processed',
              undefined,
              processingTime,
            );
            this.processedCount++;

            // Acknowledge message
            this.channel.ack(msg);

            this.logger.log(
              `✅ Message processed successfully in ${processingTime}ms`,
            );
          } catch (error) {
            const processingTime = Date.now() - startTime;

            // Update status to failed
            this.updateMessageStatus(
              messageId,
              'failed',
              error.message,
              processingTime,
            );
            this.failedCount++;

            this.logger.error('❌ Error processing message:', error);

            // Reject and requeue message (or not, depending on your strategy)
            this.channel.nack(msg, false, false); // Don't requeue failed messages
          }
        }
      });

      this.logger.log(`👂 Listening to queue: ${queue}`);
    } catch (error) {
      this.logger.error('❌ Error consuming messages:', error);
      throw error;
    }
  }
  // Publish to exchange (pub/sub pattern)
  async publish(
    exchange: string,
    routingKey: string,
    message: any,
  ): Promise<boolean> {
    try {
      await this.channel.assertExchange(exchange, 'direct', { durable: true });

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
        },
      );

      this.logger.log(`📡 Published to exchange ${exchange}:`, message);
      return published;
    } catch (error) {
      this.logger.error('❌ Error publishing message:', error);
      throw error;
    }
  }

  // Get queue info
  async getQueueInfo(queue: string) {
    try {
      const queueInfo = await this.channel.checkQueue(queue);
      return queueInfo;
    } catch (error) {
      this.logger.error('❌ Error getting queue info:', error);
      return null;
    }
  }

  // Purge queue (clear all messages)
  async purgeQueue(queue: string): Promise<void> {
    try {
      await this.channel.purgeQueue(queue);
      this.logger.log(`🗑️ Queue ${queue} purged`);
    } catch (error) {
      this.logger.error('❌ Error purging queue:', error);
      throw error;
    }
  }

  // === MONITORING METHODS ===

  private updateMessageStatus(
    messageId: string,
    status: MessageLog['status'],
    error?: string,
    processingTime?: number,
  ) {
    const messageLog = this.messageLogs.find((log) => log.id === messageId);
    if (messageLog) {
      messageLog.status = status;
      messageLog.error = error;
      messageLog.processingTime = processingTime;
      if (status === 'processed' || status === 'failed') {
        messageLog.processedAt = new Date();
      }
    }
  }

  // Get all message logs
  getMessageLogs(limit = 50): MessageLog[] {
    return this.messageLogs
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  // Get messages by status
  getMessagesByStatus(status: MessageLog['status']): MessageLog[] {
    return this.messageLogs.filter((log) => log.status === status);
  }

  // Get processing statistics
  getProcessingStats() {
    const total = this.messageLogs.length;
    const sent = this.messageLogs.filter((log) => log.status === 'sent').length;
    const processing = this.messageLogs.filter(
      (log) => log.status === 'processing',
    ).length;
    const processed = this.messageLogs.filter(
      (log) => log.status === 'processed',
    ).length;
    const failed = this.messageLogs.filter(
      (log) => log.status === 'failed',
    ).length;

    const processedMessages = this.messageLogs.filter(
      (log) => log.status === 'processed' && log.processingTime,
    );
    const avgProcessingTime =
      processedMessages.length > 0
        ? processedMessages.reduce(
            (sum, log) => sum + (log.processingTime || 0),
            0,
          ) / processedMessages.length
        : 0;

    return {
      total,
      sent,
      processing,
      processed,
      failed,
      successRate:
        total > 0 ? ((processed / total) * 100).toFixed(2) + '%' : '0%',
      avgProcessingTime: Math.round(avgProcessingTime),
    };
  }

  // Clear message logs
  clearMessageLogs(): void {
    this.messageLogs = [];
    this.processedCount = 0;
    this.failedCount = 0;
    this.logger.log('🗑️ Message logs cleared');
  }

  // Get specific message by ID
  getMessageById(messageId: string): MessageLog | undefined {
    return this.messageLogs.find((log) => log.id === messageId);
  }
  private async waitForConnection(
    maxAttempts = 30,
    delayMs = 1000,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (this.connection && this.channel) {
        this.logger.log('✅ RabbitMQ connection ready');
        return;
      }

      this.logger.warn(
        `⏳ Waiting for RabbitMQ connection (attempt ${attempt}/${maxAttempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error('RabbitMQ connection timeout');
  }
}
