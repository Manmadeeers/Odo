import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard.js';
import type {
  AuthenticatedRequestUser,
  AuthenticatedUser,
} from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';

@Controller('users')
export class CurrentUserController {
  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() user: AuthenticatedRequestUser): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  }
}
