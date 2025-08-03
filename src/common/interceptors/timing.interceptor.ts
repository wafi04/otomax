import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestTiming');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    const startHR = process.hrtime.bigint();
    
    // Extract request information
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('User-Agent') || 'Unknown';
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logTiming(startTime, startHR, method, originalUrl, response.statusCode, ip, userAgent, data);
        },
        error: (error) => {
          this.logTiming(startTime, startHR, method, originalUrl, response.statusCode || 500, ip, userAgent, null, error);
        },
      }),
    );
  }

  private logTiming(
    startTime: number,
    startHR: bigint,
    method: string,
    url: string,
    statusCode: number,
    ip: string,
    userAgent: string,
    data?: any,
    error?: any,
  ) {
    const endTime = Date.now();
    const endHR = process.hrtime.bigint();
    
    // Calculate timing
    const durationMs = endTime - startTime;
    const durationNano = Number(endHR - startHR);
    const durationMsHR = durationNano / 1000000; // Convert nanoseconds to milliseconds
    
    // Determine colors based on response time
    const timeColor = this.getTimeColor(durationMs);
    const statusColor = this.getStatusColor(statusCode);
    const reset = '\x1b[0m';
    
    // Calculate response size if available
    let responseSize = 'Unknown';
    if (data) {
      try {
        responseSize = `${JSON.stringify(data).length} bytes`;
      } catch (e) {
        responseSize = 'N/A';
      }
    }
    
    // Main timing log
    this.logger.log(
      `${method.padEnd(6)} ${url.padEnd(30)} ` +
      `${statusColor}${statusCode}${reset} ` +
      `${timeColor}${durationMs.toFixed(2)}ms${reset} ` +
      `(${durationMsHR.toFixed(3)}ms precise) ` +
      `${responseSize} - ${ip}`
    );
    
    // Log detailed info for slow requests
    if (durationMs > 1000) {
      this.logger.warn(
        `🐌 SLOW REQUEST:\n` +
        `   URL: ${method} ${url}\n` +
        `   Duration: ${durationMs}ms\n` +
        `   Status: ${statusCode}\n` +
        `   IP: ${ip}\n` +
        `   User-Agent: ${userAgent}\n` +
        `   Response Size: ${responseSize}`
      );
    }
    
    // Log errors with timing
    if (error) {
      this.logger.error(
        `❌ ERROR in ${method} ${url} after ${durationMs}ms:\n` +
        `   Error: ${error.message}\n` +
        `   Status: ${statusCode}\n` +
        `   IP: ${ip}`
      );
    }
    
    // Performance alerts
    if (durationMs > 5000) {
      this.logger.error(`🚨 CRITICAL: Request took ${durationMs}ms - investigate immediately!`);
    } else if (durationMs > 2000) {
      this.logger.warn(`⚠️  WARNING: Request took ${durationMs}ms - optimization needed`);
    }
  }

  private getTimeColor(duration: number): string {
    if (duration < 50) return '\x1b[92m';   // Bright green - Very fast
    if (duration < 100) return '\x1b[32m';  // Green - Fast
    if (duration < 300) return '\x1b[93m';  // Bright yellow - OK
    if (duration < 500) return '\x1b[33m';  // Yellow - Slow
    if (duration < 1000) return '\x1b[91m'; // Bright red - Very slow
    return '\x1b[31m';                      // Red - Critical
  }

  private getStatusColor(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '\x1b[32m'; // Green
    if (statusCode >= 300 && statusCode < 400) return '\x1b[33m'; // Yellow
    if (statusCode >= 400 && statusCode < 500) return '\x1b[91m'; // Bright red
    if (statusCode >= 500) return '\x1b[31m';                     // Red
    return '\x1b[37m'; // White for unknown
  }
}
