import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response: Response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        if (this.isPaginatedData(data)) {
          return this.formatPaginatedResponse(data, response, request);
        }

        if (this.isCustomResponse(data)) {
          return this.formatCustomResponse(data, response, request);
        }
        return this.formatDefaultResponse(data, response, request);
      }),
    );
  }

  private isPaginatedData(data: any): boolean {
    return data && typeof data === 'object' && 
           data.hasOwnProperty('items') && 
           data.hasOwnProperty('pagination');
  }

  private isCustomResponse(data: any): boolean {
    return data && typeof data === 'object' && 
           (data.hasOwnProperty('message') || data.hasOwnProperty('data'));
  }

  private formatPaginatedResponse(data: any, response: Response, request: any): PaginatedResponse<any> {
    const { items, pagination } = data;
    
    return {
      statusCode: response.statusCode,
      message: data.message || 'Data retrieved successfully',
      data: items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page * pagination.limit < pagination.total,
        hasPrev: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private formatCustomResponse(data: any, response: Response, request: any): ApiResponse<any> {
    return {
      statusCode: response.statusCode,
      message: data.message || 'Success',
      data: data.data || data,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private formatDefaultResponse(data: any, response: Response, request: any): ApiResponse<any> {
    return {
      statusCode: response.statusCode,
      message: this.getDefaultMessage(response.statusCode),
      data: data,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case 200:
        return 'Success';
      case 201:
        return 'Created successfully';
      case 204:
        return 'No content';
      default:
        return 'Success';
    }
  }
}