import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // If the response is already in our format, pass through
        if (
          response &&
          typeof response === 'object' &&
          'data' in (response as Record<string, unknown>)
        ) {
          return response as unknown as SuccessResponse<T>;
        }

        // Check if the controller returned explicit metadata
        if (
          response &&
          typeof response === 'object' &&
          'data' in (response as Record<string, unknown>) &&
          'meta' in (response as Record<string, unknown>)
        ) {
          return response as unknown as SuccessResponse<T>;
        }

        return {
          data: response,
          message: 'Success',
        } as SuccessResponse<T>;
      }),
    );
  }
}
