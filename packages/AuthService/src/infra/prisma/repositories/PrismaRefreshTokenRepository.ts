import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import {
  CreateRefreshTokenDTO,
  RefreshTokenRepository,
} from '../../../auth/application/ports/RefreshTokenRepository';
import { Atomic } from '../../../auth/application/ports/Atomic';
import { RefreshToken } from '../../../auth/domain/entities/refresh-token.entity';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(token: CreateRefreshTokenDTO): Atomic<RefreshToken> {
    const jti = randomUUID();
    const familyId = randomUUID();
    const tokenHash = createHash('sha256')
      .update(token.refreshToken)
      .digest('hex');

    const now = Date.now();

    return this.prismaService.refreshToken.create({
      data: {
        jti,
        userId: token.userId,
        sessionId: token.sessionId,
        tokenHash,
        familyId,
        parentTokenId: null,
        consumed: false,
        consumedAt: null,
        revoked: false,
        revokedAt: null,
        createdAt: new Date(now),
        expiresAt: new Date(now + token.expiresIn * 1_000),
      },
    });
  }

  delete(token: RefreshToken): Atomic<RefreshToken> {
    return this.prismaService.refreshToken.delete({
      where: { id: token.id },
    });
  }

  consume(jti: string): Atomic<RefreshToken> {
    return this.prismaService.refreshToken.update({
      where: { jti },
      data: { consumed: true, consumedAt: new Date() },
    });
  }

  revoke(jti: string): Atomic<RefreshToken> {
    return this.prismaService.refreshToken.update({
      where: { jti },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  findByJti(jti: string): Atomic<RefreshToken | null> {
    return this.prismaService.refreshToken.findUnique({
      where: { jti },
    });
  }
}
