import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REDIS } from '../redis/session.redis';
import Redis from 'ioredis';

export interface ActiveSession {
  id: string;
  userId: string;
  deviceId: string;
  ttlSeconds: number;
}

@Injectable()
export class SessionValidatorService {
  constructor(
    @Inject(SESSION_REDIS)
    private readonly redis: Redis,
  ) {}

  async validate(sessionId: string): Promise<ActiveSession | null> {
    const raw = await this.redis.get(`session:${sessionId}`);

    if (!raw) return null;

    const session = JSON.parse(raw) as ActiveSession;

    return session;
  }
}
