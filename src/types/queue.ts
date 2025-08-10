export interface MessageLog {
  id: string;
  queue: string;
  message: any;
  status: 'sent' | 'processing' | 'processed' | 'failed';
  sentAt: Date;
  processedAt?: Date;
  error?: string;
  processingTime?: number;
}

export interface ProcessingStats {
  total: number;
  sent: number;
  processing: number;
  processed: number;
  failed: number;
  successRate: string;
  avgProcessingTime: number;
}

export type MessageStatus = 'sent' | 'processing' | 'processed' | 'failed';
