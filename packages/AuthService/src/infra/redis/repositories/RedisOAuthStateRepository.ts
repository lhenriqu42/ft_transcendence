import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';
import {
  OAuthStateData,
  OAuthStateRepository,
} from '../../../auth/application/ports/oauth/OAuthStateRepository';

const NAMESPACE = 'oauth_authorization';

@Injectable()
export class RedisOAuthStateRepository implements OAuthStateRepository {
  constructor(private readonly redisService: RedisService) {}

  async save(
    state: string,
    data: OAuthStateData,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisService
      .getClient()
      .set(`${NAMESPACE}:${state}`, JSON.stringify(data), 'EX', ttlSeconds);
  }

  async find(state: string): Promise<OAuthStateData | null> {
    const value = await this.redisService
      .getClient()
      .get(`${NAMESPACE}:${state}`);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as OAuthStateData;
  }

  async delete(state: string): Promise<void> {
    await this.redisService.getClient().del(`${NAMESPACE}:${state}`);
  }
}
