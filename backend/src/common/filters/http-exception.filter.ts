import {
  ArgumentsHost,
  ExceptionFilter,
  BadRequestException,
  Catch,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import type { Response } from 'express';
import { STATUS_CODES } from 'http';
import snakeCase from 'lodash/snakeCase';

@Catch(BadRequestException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(public reflector: Reflector) {}

  public catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let statusCode = exception.getStatus();
    const r = exception.getResponse() as Record<string, unknown>;

    const message = r.message;
    if (
      Array.isArray(message) &&
      message.length > 0 &&
      message[0] instanceof ValidationError
    ) {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      const validationErrors = message as ValidationError[];
      this._validationFilter(validationErrors);
    }

    r.statusCode = statusCode;
    r.error = STATUS_CODES[statusCode];

    response.status(statusCode).json(r);
  }

  private _validationFilter(validationErrors: ValidationError[]) {
    for (const validationError of validationErrors) {
      const constraints = validationError.constraints;
      if (constraints) {
        for (const [constraintKey, constraint] of Object.entries(constraints)) {
          if (!constraint) {
            constraints[constraintKey] = 'error.fields.' + snakeCase(constraintKey);
          }
        }
      }
      if (validationError.children && validationError.children.length > 0) {
        this._validationFilter(validationError.children);
      }
    }
  }
}
