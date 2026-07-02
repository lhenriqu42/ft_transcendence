import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REDIS } from '../../.shared/redis/session.redis';
import Redis from 'ioredis/built/Redis';
import { ChallengePayload } from '../application/challenge.service';

@Injectable()
export class ChallengeStoreService {
  constructor(
    @Inject(SESSION_REDIS)
    private readonly redis: Redis,
  ) {}

  async save(
    challengeId: string,
    payload: ChallengePayload,
    timeout?: number,
  ): Promise<void> {
    await this.redis.set(
      `challenge:${challengeId}`,
      JSON.stringify(payload),
      'EX',
      timeout || 300,
    );
  }

  async find(challengeId: string): Promise<ChallengePayload | null> {
    const raw = await this.redis.get(`challenge:${challengeId}`);

    if (!raw) return null;

    return JSON.parse(raw) as ChallengePayload;
  }

  async delete(challengeId: string): Promise<void> {
    await this.redis.del(`challenge:${challengeId}`);
  }
}
