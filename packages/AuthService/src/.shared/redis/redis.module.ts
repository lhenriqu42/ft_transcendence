import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { SESSION_REDIS } from './session.redis';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SESSION_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.getOrThrow<string>('REDIS_SESSION_HOST'),
          port: config.getOrThrow<number>('REDIS_SESSION_PORT'),
          username: config.getOrThrow<string>('REDIS_SESSION_USERNAME'),
          password: config.getOrThrow('REDIS_SESSION_PASSWORD'),
        });
      },
    },
  ],
  exports: [SESSION_REDIS],
})
export class RedisModule {}
