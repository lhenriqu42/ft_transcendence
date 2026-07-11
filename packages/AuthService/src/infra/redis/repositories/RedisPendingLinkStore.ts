import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';
import {
  PendingLinkData,
  PendingLinkStore,
} from '../../../auth/application/ports';

const NAMESPACE = 'pending_link';

@Injectable()
export class RedisPendingLinkStore implements PendingLinkStore {
  constructor(private readonly redisService: RedisService) {}

  async set(
    token: string,
    data: PendingLinkData,
    opts: { ttlSeconds: number },
  ): Promise<void> {
    await this.redisService
      .getClient()
      .set(
        `${NAMESPACE}:${token}`,
        JSON.stringify(data),
        'EX',
        opts.ttlSeconds,
      );
  }

  async get(token: string): Promise<PendingLinkData | null> {
    const raw = await this.redisService
      .getClient()
      .get(`${NAMESPACE}:${token}`);

    if (!raw) return null;

    return JSON.parse(raw) as PendingLinkData;
  }

  async delete(token: string): Promise<void> {
    await this.redisService.getClient().del(`${NAMESPACE}:${token}`);
  }
}
