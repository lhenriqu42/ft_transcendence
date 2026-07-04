import { Module } from '@nestjs/common';
import { IpLookupImpl } from './info/IpLookupImpl';
import { IpLookup } from '../auth/application/ports/IpLookup';
import { UserRepository } from '../auth/application/ports/UserRepository';
import { PrismaUserRepository } from './prisma/repositories/PrismaUserRepository';
import { ChallengeRepository } from '../auth/application/ports/ChallengeRepository';
import { PrismaSessionRepository } from './prisma/repositories/PrismaSessionRepository';
import { RedisChallengeRepository } from './redis/repositories/RedisChallengeRepository';
import { RefreshTokenRepository } from '../auth/application/ports/RefreshTokenRepository';
import { ActiveSessionRepository } from '../auth/application/ports/ActiveSessionRepository';
import { SessionHistoryRepository } from '../auth/application/ports/SessionHistoryRepository';
import { RedisActiveSessionRepository } from './redis/repositories/RedisActiveSessionRepository';
import { PrismaRefreshTokenRepository } from './prisma/repositories/PrismaRefreshTokenRepository';
import { PrismaDeviceRepository } from './prisma/repositories/PrismaDeviceRepository';
import { PrismaUnitOfWork } from './prisma/utils/prisma-unit-of-work';
import { UnitOfWork } from '../auth/application/ports/unit-of-work';
import { DeviceRepository } from '../auth/application/ports';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { LoginHistoryRepository } from '../auth/application/ports/LoginHistoryRepository';
import { PrismaLoginHistoryRepository } from './prisma/repositories/PrismaLoginHistoryRepository';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: IpLookup,
      useClass: IpLookupImpl,
    },
    {
      provide: RefreshTokenRepository,
      useClass: PrismaRefreshTokenRepository,
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
      provide: SessionHistoryRepository,
      useClass: PrismaSessionRepository,
    },
    {
      provide: DeviceRepository,
      useClass: PrismaDeviceRepository,
    },
    {
      provide: LoginHistoryRepository,
      useClass: PrismaLoginHistoryRepository,
    },
  ],
  exports: [
    IpLookup,
    UnitOfWork,
    UserRepository,
    DeviceRepository,
    ChallengeRepository,
    LoginHistoryRepository,
    RefreshTokenRepository,
    ActiveSessionRepository,
    SessionHistoryRepository,
  ],
})
export class InfraModule {}
