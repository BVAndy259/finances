import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessRuleError } from '@expense-tracker/core';

@Catch(BusinessRuleError)
export class BusinessRuleExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessRuleError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: 'Bad Request',
    });
  }
}
