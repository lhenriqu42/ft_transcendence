import { Injectable } from '@nestjs/common';
import { SessionHistoryRepository } from '../../../auth/application/ports/SessionHistoryRepository';
import { Session } from '../../../auth/domain/entities/session.entity';
import { PrismaService } from '../prisma.service';
import { Atomic } from '../../../auth/application/ports/Atomic';

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
}
