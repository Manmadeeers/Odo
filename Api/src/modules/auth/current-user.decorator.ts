import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequestUser } from './auth.types.js';

interface RequestWithUser {
  user: AuthenticatedRequestUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRequestUser =>
    context.switchToHttp().getRequest<RequestWithUser>().user,
);
