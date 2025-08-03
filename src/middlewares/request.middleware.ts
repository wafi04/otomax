import { Logger } from "@nestjs/common";

export function requestTimingMiddleware(req: any, res: any, next: any) {
  const logger = new Logger('RequestTiming');
  const startTime = Date.now();
  const startHR = process.hrtime();

  // Capture original end method
  const originalEnd = res.end;
  
  res.end = function(...args: any[]) {
    const endTime = Date.now();
    const hrDuration = process.hrtime(startHR);
    
    // Calculate timing in different formats
    const durationMs = endTime - startTime;
    const durationHR = hrDuration[0] * 1000 + hrDuration[1] / 1000000; // Convert to ms
    
    // Get request info
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Color coding based on response time
    let timeColor = '';
    if (durationMs < 100) timeColor = '\x1b[32m'; // Green - Fast
    else if (durationMs < 500) timeColor = '\x1b[33m'; // Yellow - Medium
    else timeColor = '\x1b[31m'; // Red - Slow
    
    // Status code color
    let statusColor = '';
    if (statusCode >= 200 && statusCode < 300) statusColor = '\x1b[32m'; // Green
    else if (statusCode >= 300 && statusCode < 400) statusColor = '\x1b[33m'; // Yellow
    else if (statusCode >= 400) statusColor = '\x1b[31m'; // Red
    
    // Reset color
    const reset = '\x1b[0m';
    
    // Detailed log with timing
    logger.log(
      `${method} ${url} ` +
      `${statusColor}${statusCode}${reset} ` +
      `${timeColor}${durationMs.toFixed(2)}ms${reset} ` +
      `(${durationHR.toFixed(3)}ms precise) ` +
      `- ${ip}`
    );
    
    // Log slow requests with more details
    if (durationMs > 1000) {
      logger.warn(
        `🐌 SLOW REQUEST DETECTED: ${method} ${url} took ${durationMs}ms\n` +
        `   User-Agent: ${userAgent}\n` +
        `   IP: ${ip}\n` +
        `   Status: ${statusCode}`
      );
    }
    
    // Call original end method
    originalEnd.apply(res, args);
  };
  
  next();
}
