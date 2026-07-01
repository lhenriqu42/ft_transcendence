import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { CACHE_REDIS } from './cache.redis';
import { SESSION_REDIS } from './session.redis';

@Module({
  imports: [ConfigModule],
  providers: [
    // 🔵 CACHE REDIS
    {
      provide: CACHE_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.getOrThrow<string>('REDIS_CACHE_HOST'),
          port: config.getOrThrow<number>('REDIS_CACHE_PORT'),
          password: config.getOrThrow('REDIS_CACHE_PASSWORD'),
        });
      },
    },

    // 🔴 SESSION REDIS
    {
      provide: SESSION_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.getOrThrow<string>('REDIS_SESSION_HOST'),
          port: config.getOrThrow<number>('REDIS_SESSION_PORT'),
          password: config.getOrThrow('REDIS_SESSION_PASSWORD'),
        });
      },
    },
  ],
  exports: [CACHE_REDIS, SESSION_REDIS],
})
export class RedisModule {}
