import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { AuthenticatedRequestUser } from './auth.types.js';
import { AuthSession } from './entities/auth-session.entity.js';

interface RequestWithAuthentication {
  headers: { authorization?: string };
  user?: AuthenticatedRequestUser;
}

interface AccessTokenPayload {
  sub?: unknown;
  sid?: unknown;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(AuthSession)
    private readonly sessionsRepository: Repository<AuthSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuthentication>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const session = await this.sessionsRepository
      .createQueryBuilder('session')
      .innerJoinAndSelect('session.user', 'user')
      .where('session.id = :sessionId', { sessionId: payload.sid })
      .andWhere('session.userId = :userId', { userId: payload.sub })
      .andWhere('session.revokedAt IS NULL')
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .getOne();

    if (!session) {
      throw new UnauthorizedException('Session is no longer active');
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      emailVerified: session.user.emailVerifiedAt !== null,
      sessionId: session.id,
    };

    return true;
  }

  private extractBearerToken(authorization?: string): string | undefined {
    const [scheme, token, extra] = authorization?.trim().split(/\s+/) ?? [];
    return scheme?.toLowerCase() === 'bearer' && token && !extra
      ? token
      : undefined;
  }
}
