import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import {
  createRouteSchema,
  type CreateRouteDto,
} from './dto/create-route.dto.js';
import { RoutingService } from './routing.service.js';
import type { RoutePreview } from './routing.types.js';

@Controller('routes')
@UseGuards(AccessTokenGuard)
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  preview(
    @Body({ schema: createRouteSchema }) input: CreateRouteDto,
  ): Promise<RoutePreview> {
    return this.routingService.createPreview(input);
  }
}
