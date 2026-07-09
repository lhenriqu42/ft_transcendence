import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { Global, Module } from '@nestjs/common';
import { RedisPasswordResetRepository } from './repositories/RedisPasswordResetRepository';
import { RedisChallengeRepository } from './repositories/RedisChallengeRepository';
import { RedisActiveSessionRepository } from './repositories/RedisActiveSessionRepository';
import { RedisOAuthAuthorizationRepository } from './repositories/RedisOAuthAuthorizationRepository';
import {
  ChallengeRepository,
  ActiveSessionRepository,
  PasswordResetRepository,
} from '../../auth/application/ports';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    RedisOAuthAuthorizationRepository,
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
  ],
  exports: [
    RedisService,
    ChallengeRepository,
    ActiveSessionRepository,
    PasswordResetRepository,
    RedisOAuthAuthorizationRepository,
  ],
})
export class RedisModule {}
