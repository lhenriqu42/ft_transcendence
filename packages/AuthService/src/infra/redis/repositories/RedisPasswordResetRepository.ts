import { Injectable } from '@nestjs/common';
import { PasswordResetRepository } from '../../../auth/application/ports/PasswordResetRepository';
import { RedisService } from '../redis.service';

const NAMESPACE = 'password_reset';

@Injectable()
export class RedisPasswordResetRepository implements PasswordResetRepository {
  constructor(private readonly redisService: RedisService) {}

  async saveChallenge(tokenHash: string, userId: string): Promise<void> {
    const redisClient = this.redisService.getClient();
    await redisClient.set(`${NAMESPACE}:${tokenHash}`, userId, 'EX', 3600); // Set expiration to 1 hour
  }

  async getUserIdByTokenHash(tokenHash: string): Promise<string | null> {
    const redisClient = this.redisService.getClient();
    const userId = await redisClient.get(`${NAMESPACE}:${tokenHash}`);
    return userId;
  }

  async deleteChallenge(tokenHash: string): Promise<void> {
    const redisClient = this.redisService.getClient();
    await redisClient.del(`${NAMESPACE}:${tokenHash}`);
  }
}
