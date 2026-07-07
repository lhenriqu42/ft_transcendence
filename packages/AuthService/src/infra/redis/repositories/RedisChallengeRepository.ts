import { Injectable } from '@nestjs/common';
import {
  ChallengePayload,
  ChallengeRepository,
} from '../../../auth/application/ports/ChallengeRepository';
import { randomUUID } from 'crypto';
import { RedisService } from '../redis.service';

const NAMESPACE = 'challenge';

@Injectable()
export class RedisChallengeRepository implements ChallengeRepository {
  constructor(private readonly redisService: RedisService) {}

  async save(payload: ChallengePayload, timeout?: number): Promise<string> {
    const challengeId = randomUUID();
    await this.redisService
      .getClient()
      .set(
        `${NAMESPACE}:${challengeId}`,
        JSON.stringify(payload),
        'EX',
        timeout || 300,
      );
    return challengeId;
  }

  async find(id: string): Promise<ChallengePayload | null> {
    const raw = await this.redisService.getClient().get(`${NAMESPACE}:${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as ChallengePayload;
  }

  async delete(id: string): Promise<void> {
    await this.redisService.getClient().del(`${NAMESPACE}:${id}`);
  }
}
