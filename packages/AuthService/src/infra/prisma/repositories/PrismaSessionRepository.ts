import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SessionRevokedReason } from '../generated/enums';
import { Atomic } from '../../../auth/application/ports/Atomic';
import { Session } from '../../../auth/domain/entities/session.entity';
import { SessionHistoryRepository } from '../../../auth/application/ports/SessionHistoryRepository';

@Injectable()
export class PrismaSessionRepository implements SessionHistoryRepository {
  constructor(private readonly prismaService: PrismaService) {}

  save(session: Omit<Session, 'revokedAt' | 'revokedReason'>): Atomic<Session> {
    return this.prismaService.session.create({
      data: {
        id: session.id,
        userId: session.userId,
        deviceId: session.deviceId,
        createdAt: session.createdAt,
      },
    });
  }

  findById(id: string): Atomic<Session | null> {
    return this.prismaService.session.findUnique({
      where: { id },
    });
  }

  findByUserId(userId: string): Atomic<Session[]> {
    return this.prismaService.session.findMany({
      where: { userId },
    });
  }

  close(
    id: string,
    revokedAt: Date,
    reason: SessionRevokedReason,
  ): Atomic<Session> {
    return this.prismaService.session.update({
      where: { id },
      data: { revokedAt, revokedReason: reason },
    });
  }

  closeAllByUserId(
    userId: string,
    revokedAt: Date,
    reason: SessionRevokedReason,
  ): Atomic<{ count: number }> {
    return this.prismaService.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt, revokedReason: reason },
    });
  }
}
