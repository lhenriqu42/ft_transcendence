import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redisClient: Redis;
  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_SESSION_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_SESSION_PORT'),
      username: this.configService.getOrThrow<string>('REDIS_SESSION_USERNAME'),
      password: this.configService.getOrThrow('REDIS_SESSION_PASSWORD'),
    });
  }

  getClient(): Redis {
    return this.redisClient;
  }
}
