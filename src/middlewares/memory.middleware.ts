import { Logger } from "@nestjs/common";

// Memory usage middleware
export function memoryUsageMiddleware(req: any, res: any, next: any) {
  const logger = new Logger('MemoryUsage');
  
  // Log memory usage every 100 requests (adjust as needed)
  if (Math.random() < 0.01) { // 1% chance to log memory
    const memUsage = process.memoryUsage();
    logger.log(
      `Memory Usage: ` +
      `RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB, ` +
      `Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB, ` +
      `Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB, ` +
      `External: ${(memUsage.external / 1024 / 1024).toFixed(2)}MB`
    );
  }
  
  next();
}