import { Injectable } from '@nestjs/common';

import { RedisService } from '../redis.service';
import {
  ActiveSession,
  ActiveSessionRepository,
} from '../../../auth/application/ports/session/ActiveSessionRepository';

const NAMESPACE = 'session';

// Rede de segurança: se o usuário nunca mais logar, o índice dele some
// sozinho depois desse tempo em vez de acumular pra sempre. Renovado a
// cada save(), então usuário ativo nunca perde o índice no meio do uso.
const INDEX_SAFETY_TTL_SECONDS = 32 * 24 * 60 * 60; // > TTL do refresh token

@Injectable()
export class RedisActiveSessionRepository implements ActiveSessionRepository {
  constructor(private readonly redisService: RedisService) {}

  async save(session: ActiveSession): Promise<void> {
    const indexKey = this.userIndexKey(session.userId);

    await this.redisService
      .getClient()
      .multi()
      .set(
        `${NAMESPACE}:${session.id}`,
        JSON.stringify(session),
        'EX',
        session.ttlSeconds,
      )
      .sadd(indexKey, session.id)
      .expire(indexKey, INDEX_SAFETY_TTL_SECONDS)
      .exec();
  }

  async get(sessionId: string): Promise<ActiveSession | null> {
    const raw = await this.redisService
      .getClient()
      .get(`${NAMESPACE}:${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSession;
  }

  async delete(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);

    const multi = this.redisService
      .getClient()
      .multi()
      .del(`${NAMESPACE}:${sessionId}`);
    if (session) {
      multi.srem(this.userIndexKey(session.userId), sessionId);
    }
    await multi.exec();
  }

  async exists(sessionId: string): Promise<boolean> {
    const exists = await this.redisService
      .getClient()
      .exists(`${NAMESPACE}:${sessionId}`);
    return exists === 1;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    const client = this.redisService.getClient();
    const indexKey = this.userIndexKey(userId);

    const sessionIds = await client.smembers(indexKey);
    if (sessionIds.length === 0) {
      await client.del(indexKey);
      return;
    }

    const multi = client.multi();
    for (const id of sessionIds) {
      multi.del(`${NAMESPACE}:${id}`);
    }
    multi.del(indexKey);
    await multi.exec();
  }

  private userIndexKey(userId: string): string {
    return `${NAMESPACE}:by-user:${userId}`;
  }
}
