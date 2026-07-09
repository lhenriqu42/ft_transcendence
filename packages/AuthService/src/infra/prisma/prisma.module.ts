import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  UnitOfWork,
  UserRepository,
  DeviceRepository,
  RefreshTokenRepository,
  LoginHistoryRepository,
  SessionHistoryRepository,
  PasswordHistoryRepository,
} from '../../auth/application/ports';
import { PrismaUnitOfWork } from './utils/prisma-unit-of-work';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaDeviceRepository } from './repositories/PrismaDeviceRepository';
import { PrismaSessionRepository } from './repositories/PrismaSessionRepository';
import { PrismaRefreshTokenRepository } from './repositories/PrismaRefreshTokenRepository';
import { PrismaLoginHistoryRepository } from './repositories/PrismaLoginHistoryRepository';
import { PrismaPasswordHistoryRepository } from './repositories/PrismaPasswordHistoryRepository';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: RefreshTokenRepository,
      useClass: PrismaRefreshTokenRepository,
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
  ],
  exports: [
    UnitOfWork,
    PrismaService,
    UserRepository,
    DeviceRepository,
    RefreshTokenRepository,
    LoginHistoryRepository,
    SessionHistoryRepository,
    PasswordHistoryRepository,
  ],
})
export class PrismaModule {}
