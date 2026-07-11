import { Atomic } from '../../../auth/application/ports';
import { PasswordHistoryRepository } from '../../../auth/application/ports/user/PasswordHistoryRepository';
import { PasswordHistory } from '../../../auth/domain/entities/password-history.entity';
import { PrismaService } from '../prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaPasswordHistoryRepository
  implements PasswordHistoryRepository
{
  constructor(private readonly prismaService: PrismaService) {}

  save(
    entry: Omit<PasswordHistory, 'id' | 'createdAt'>,
  ): Atomic<PasswordHistory> {
    return this.prismaService.passwordHistory.create({
      data: {
        userId: entry.userId,
        passwordHash: entry.passwordHash,
        createdAt: new Date(),
      },
    });
  }
}
