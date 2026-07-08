import { Module } from '@nestjs/common';
import { IpLookupImpl } from './info/IpLookupImpl';
import { IpLookup } from '../auth/application/ports/IpLookup';
import { UserRepository } from '../auth/application/ports/UserRepository';
import { PrismaUserRepository } from './prisma/repositories/PrismaUserRepository';
import { ChallengeRepository } from '../auth/application/ports/ChallengeRepository';
import { PrismaDeviceRepository } from './prisma/repositories/PrismaDeviceRepository';
import { PrismaSessionRepository } from './prisma/repositories/PrismaSessionRepository';
import { RedisChallengeRepository } from './redis/repositories/RedisChallengeRepository';
import { LoginHistoryRepository } from '../auth/application/ports/LoginHistoryRepository';
import { RefreshTokenRepository } from '../auth/application/ports/RefreshTokenRepository';
import { ActiveSessionRepository } from '../auth/application/ports/ActiveSessionRepository';
import { SessionHistoryRepository } from '../auth/application/ports/SessionHistoryRepository';
import { PrismaPasswordHistoryRepository } from './prisma/repositories/PrismaPasswordHistoryRepository';
import { PrismaRefreshTokenRepository } from './prisma/repositories/PrismaRefreshTokenRepository';
import { PrismaLoginHistoryRepository } from './prisma/repositories/PrismaLoginHistoryRepository';
import { RedisActiveSessionRepository } from './redis/repositories/RedisActiveSessionRepository';
import { RedisPasswordResetRepository } from './redis/repositories/RedisPasswordResetRepository';
import { PasswordHistoryRepository } from '../auth/application/ports/PasswordHistoryRepository';
import { PasswordResetRepository } from '../auth/application/ports/PasswordResetRepository';
import { PrismaUnitOfWork } from './prisma/utils/prisma-unit-of-work';
import { UnitOfWork } from '../auth/application/ports/unit-of-work';
import { DeviceRepository } from '../auth/application/ports';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

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
    {
      provide: PasswordHistoryRepository,
      useClass: PrismaPasswordHistoryRepository,
    },
    {
      provide: PasswordResetRepository,
      useClass: RedisPasswordResetRepository,
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
    PasswordResetRepository,
    PasswordHistoryRepository,
  ],
})
export class InfraModule {}
