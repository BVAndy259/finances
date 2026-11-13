import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppUser } from '@expense-tracker/core';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AppUser => {
    const request = context.switchToHttp().getRequest<{ user: AppUser }>();
    return request.user;
  },
);
