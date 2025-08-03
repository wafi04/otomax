
// common/interceptors/performance.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRequests: number;
  lastReset: Date;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private metrics: PerformanceMetrics = {
    totalRequests: 0,
    averageResponseTime: 0,
    slowRequests: 0,
    errorRequests: 0,
    lastReset: new Date(),
  };
  
  private responseTimes: number[] = [];
  private readonly maxSamples = 1000; // Keep last 1000 response times

  constructor() {
    // Log performance summary every 5 minutes
    setInterval(() => {
      this.logPerformanceSummary();
    }, 5 * 60 * 1000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.updateMetrics(duration, false);
        },
        error: () => {
          const duration = Date.now() - startTime;
          this.updateMetrics(duration, true);
        },
      }),
    );
  }

  private updateMetrics(duration: number, isError: boolean) {
    this.metrics.totalRequests++;
    
    if (isError) {
      this.metrics.errorRequests++;
    }
    
    if (duration > 1000) {
      this.metrics.slowRequests++;
    }
    
    // Add to response times array
    this.responseTimes.push(duration);
    
    // Keep only the last N samples
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes = this.responseTimes.slice(-this.maxSamples);
    }
    
    // Update average
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  private logPerformanceSummary() {
    if (this.metrics.totalRequests === 0) return;
    
    const uptime = Date.now() - this.metrics.lastReset.getTime();
    const uptimeMinutes = Math.floor(uptime / 60000);
    
    // Calculate percentiles
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p50 = this.getPercentile(sortedTimes, 50);
    const p95 = this.getPercentile(sortedTimes, 95);
    const p99 = this.getPercentile(sortedTimes, 99);
    
    const errorRate = ((this.metrics.errorRequests / this.metrics.totalRequests) * 100).toFixed(2);
    const slowRate = ((this.metrics.slowRequests / this.metrics.totalRequests) * 100).toFixed(2);
    
    this.logger.log(
      `📊 PERFORMANCE SUMMARY (${uptimeMinutes}min):\n` +
      `   Total Requests: ${this.metrics.totalRequests}\n` +
      `   Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms\n` +
      `   Response Time Percentiles:\n` +
      `     50th (median): ${p50.toFixed(2)}ms\n` +
      `     95th: ${p95.toFixed(2)}ms\n` +
      `     99th: ${p99.toFixed(2)}ms\n` +
      `   Error Rate: ${errorRate}%\n` +
      `   Slow Requests (>1s): ${this.metrics.slowRequests} (${slowRate}%)\n` +
      `   Requests/min: ${(this.metrics.totalRequests / uptimeMinutes).toFixed(2)}`
    );
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorRequests: 0,
      lastReset: new Date(),
    };
    this.responseTimes = [];
    this.logger.log('🔄 Performance metrics reset');
  }
}