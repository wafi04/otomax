import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  details?: any;
}

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    return next.handle().pipe(
      catchError((error) => {
        const errorResponse: ErrorResponse = {
          statusCode: error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
          message: error instanceof HttpException ? error.message : 'Internal server error',
          error: error.name || 'Error',
          timestamp: new Date().toISOString(),
          path: request.url,
          ...(error.response && { details: error.response }),
        };

        return throwError(() => new HttpException(errorResponse, errorResponse.statusCode));
      }),
    );
  }
}
