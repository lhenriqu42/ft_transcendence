import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { Global, Module } from '@nestjs/common';
import {
  PendingLinkStore,
  ChallengeRepository,
  OAuthStateRepository,
  ActiveSessionRepository,
  PasswordResetRepository,
} from '../../auth/application/ports';
import { RedisPendingLinkStore } from './repositories/RedisPendingLinkStore';
import { RedisChallengeRepository } from './repositories/RedisChallengeRepository';
import { RedisOAuthStateRepository } from './repositories/RedisOAuthStateRepository';
import { RedisPasswordResetRepository } from './repositories/RedisPasswordResetRepository';
import { RedisActiveSessionRepository } from './repositories/RedisActiveSessionRepository';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    {
      provide: OAuthStateRepository,
      useClass: RedisOAuthStateRepository,
    },
    {
      provide: ActiveSessionRepository,
      useClass: RedisActiveSessionRepository,
    },
    {
      provide: ChallengeRepository,
      useClass: RedisChallengeRepository,
    },
    {
      provide: PasswordResetRepository,
      useClass: RedisPasswordResetRepository,
    },
    {
      provide: PendingLinkStore,
      useClass: RedisPendingLinkStore,
    },
  ],
  exports: [
    RedisService,
    PendingLinkStore,
    ChallengeRepository,
    OAuthStateRepository,
    ActiveSessionRepository,
    PasswordResetRepository,
  ],
})
export class RedisModule {}
