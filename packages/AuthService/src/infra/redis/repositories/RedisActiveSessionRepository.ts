import { Injectable } from '@nestjs/common';

import { RedisService } from '../redis.service';
import {
  ActiveSession,
  ActiveSessionRepository,
} from '../../../auth/application/ports/ActiveSessionRepository';

const NAMESPACE = 'session';

@Injectable()
export class RedisActiveSessionRepository implements ActiveSessionRepository {
  constructor(private readonly redisService: RedisService) {}

  async save(session: ActiveSession): Promise<void> {
    await this.redisService
      .getClient()
      .set(
        `${NAMESPACE}:${session.id}`,
        JSON.stringify(session),
        'EX',
        session.ttlSeconds,
      );
  }

  async get(sessionId: string): Promise<ActiveSession | null> {
    const raw = await this.redisService
      .getClient()
      .get(`${NAMESPACE}:${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSession;
  }

  async delete(sessionId: string): Promise<void> {
    await this.redisService.getClient().del(`${NAMESPACE}:${sessionId}`);
  }

  async exists(sessionId: string): Promise<boolean> {
    const exists = await this.redisService
      .getClient()
      .exists(`${NAMESPACE}:${sessionId}`);
    return exists === 1;
  }
}
