import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RoutingController } from './routing.controller.js';
import { RoutingService } from './routing.service.js';

@Module({
  imports: [AuthModule],
  controllers: [RoutingController],
  providers: [RoutingService],
})
export class RoutingModule {}
