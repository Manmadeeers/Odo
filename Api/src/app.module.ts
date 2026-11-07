import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDatabaseOptions } from './database/database.config.js';
import { environmentSchema } from './config/environment.schema.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: environmentSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        ...createDatabaseOptions(
          configService.getOrThrow<string>('DATABASE_URL'),
        ),
        autoLoadEntities: true,
        entities: [],
        migrations: [],
      }),
    }),
    AuthModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
