import { Atomic } from '../../../auth/application/ports/utils/Atomic';
import { PrismaService } from '../prisma.service';
import { Injectable } from '@nestjs/common';
import {
  LoginHistoryRepository,
  LoginHistoryFailureRecord,
  LoginHistorySuccessRecord,
} from '../../../auth/application/ports/session/LoginHistoryRepository';
import { LoginHistory } from '../../../auth/domain/entities/login-history.entity';

@Injectable()
export class PrismaLoginHistoryRepository implements LoginHistoryRepository {
  constructor(private readonly prismaService: PrismaService) {}

  recordSuccess(record: LoginHistorySuccessRecord): Atomic<LoginHistory> {
    return this.prismaService.loginHistory.create({
      data: {
        ...record,
        success: true,
        failureReason: null,
        createdAt: new Date(),
      },
    });
  }

  recordFailure(record: LoginHistoryFailureRecord): Atomic<LoginHistory> {
    return this.prismaService.loginHistory.create({
      data: {
        ...record,
        success: false,
        createdAt: new Date(),
      },
    });
  }
}
