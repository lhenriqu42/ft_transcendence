import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';

const NAMESPACE = 'oauth_authorization';

export interface OAuthAuthorizationData {
  codeVerifier?: string;
}

@Injectable()
export class RedisOAuthAuthorizationRepository {
  constructor(private readonly redisService: RedisService) {}

  async save(
    state: string,
    data: OAuthAuthorizationData,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisService
      .getClient()
      .set(`${NAMESPACE}:${state}`, JSON.stringify(data), 'EX', ttlSeconds);
  }

  async find(state: string): Promise<OAuthAuthorizationData | null> {
    const value = await this.redisService
      .getClient()
      .get(`${NAMESPACE}:${state}`);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as OAuthAuthorizationData;
  }

  async delete(state: string): Promise<void> {
    await this.redisService.getClient().del(`${NAMESPACE}:${state}`);
  }
}
