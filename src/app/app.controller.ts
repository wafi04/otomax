import { Controller, Get, Post, Body, Logger, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { RabbitMQService } from 'src/lib/rabbitmq/rabbitmq.service';
import { MessageLog, ProcessingStats, MessageStatus } from 'src/types/queue';
import { formatDate } from 'src/utils/format';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly rabbitMQ: RabbitMQService,
  ) {
    // Setup consumer saat controller diinisialisasi
    this.setupMessageConsumer();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Simple send message
  @Get('send')
  async sendMessage() {
    const message = {
      text: 'Hello from NestJS!',
      timestamp: formatDate(new Date().toISOString()),
      type: 'greeting',
    };

    const messageId = await this.rabbitMQ.sendToQueue('my_queue', message);

    return {
      success: true,
      message: 'Message sent to RabbitMQ queue',
      messageId,
      data: message,
    };
  }

  // Send custom message
  @Post('send')
  async sendCustomMessage(@Body() body: any) {
    const messageId = await this.rabbitMQ.sendToQueue('my_queue', body);

    return {
      success: true,
      message: 'Custom message sent',
      messageId,
      data: body,
    };
  }

  // Publish to exchange
  @Get('publish')
  async publishMessage() {
    const message = {
      event: 'user_registered',
      userId: 123,
      email: 'user@example.com',
      timestamp: new Date().toISOString(),
    };

    await this.rabbitMQ.publish('events', 'user.registered', message);

    return {
      success: true,
      message: 'Event published',
      data: message,
    };
  }

  // Get queue status
  @Get('queue-info')
  async getQueueInfo() {
    const info = await this.rabbitMQ.getQueueInfo('my_queue');
    return { queueInfo: info };
  }

  // Clear queue
  @Post('clear-queue')
  async clearQueue() {
    await this.rabbitMQ.purgeQueue('my_queue');
    return { success: true, message: 'Queue cleared' };
  }

  // === MONITORING ENDPOINTS ===

  // Get all messages with their processing status
  @Get('messages')
  getMessages(): { success: boolean; count: number; messages: MessageLog[] } {
    const messages = this.rabbitMQ.getMessageLogs();
    return {
      success: true,
      count: messages.length,
      messages,
    };
  }

  // Get processing statistics
  @Get('messages/stats')
  getMessageStats(): { success: boolean; stats: ProcessingStats } {
    const stats = this.rabbitMQ.getProcessingStats();
    return {
      success: true,
      stats,
    };
  }

  // Get messages by status
  @Get('messages/status/:status')
  getMessagesByStatus(@Param('status') status: string): {
    success: boolean;
    status?: string;
    count?: number;
    messages?: MessageLog[];
    error?: string;
  } {
    const validStatuses: MessageStatus[] = [
      'sent',
      'processing',
      'processed',
      'failed',
    ];
    if (!validStatuses.includes(status as MessageStatus)) {
      return {
        success: false,
        error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`,
      };
    }

    const messages = this.rabbitMQ.getMessagesByStatus(status as MessageStatus);
    return {
      success: true,
      status,
      count: messages.length,
      messages,
    };
  }

  // Get specific message by ID
  @Get('messages/:messageId')
  getMessageById(@Param('messageId') messageId: string): {
    success: boolean;
    message?: MessageLog;
    error?: string;
  } {
    const message = this.rabbitMQ.getMessageById(messageId);

    if (!message) {
      return {
        success: false,
        error: 'Message not found',
      };
    }

    return {
      success: true,
      message,
    };
  }

  // Clear message logs
  @Post('messages/clear')
  clearMessageLogs() {
    this.rabbitMQ.clearMessageLogs();
    return {
      success: true,
      message: 'Message logs cleared',
    };
  }

  // Setup message consumer
  private async setupMessageConsumer() {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for RabbitMQ connection

    this.rabbitMQ.consumeFromQueue('my_queue', async (message) => {
      // Handle received message
      console.log(`🎯 Processing message: ${new Date().getMinutes()}`, message);

      // Simulate different processing scenarios
      if (message.type === 'bulk' && message.index % 3 === 0) {
        // Simulate occasional failures
        throw new Error('Simulated processing error for bulk message');
      }

      // Simulate processing time
      const processingTime = Math.random() * 2000 + 500; // 0.5-2.5 seconds
      await new Promise((resolve) => setTimeout(resolve, processingTime));

      // Your business logic here
      if (message.text) {
        console.log(`✅ Processed text: ${message.text}`);
      }

      if (message.type === 'greeting') {
        console.log('👋 Greeting message processed successfully');
      }

      if (message.type === 'bulk') {
        console.log(`📦 Bulk message ${message.index} processed`);
      }

      // Send notification, save to database, etc.
    });
  }
}
