import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REDIS } from '../redis/session.redis';
import Redis from 'ioredis';

type Session = {
  sessionId: string;
  userId: string;
  deviceId: string;
  revoked?: boolean;
  createdAt: number;
};

@Injectable()
export class SessionValidatorService {
  constructor(
    @Inject(SESSION_REDIS)
    private readonly redis: Redis,
  ) {}

  async validate(sessionId: string): Promise<Session | null> {
    const raw = await this.redis.get(`session:${sessionId}`);

    if (!raw) return null;

    const session = JSON.parse(raw) as Session;

    if (session.revoked) return null;

    return session;
  }
}
