import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import {
  CreateRefreshTokenDTO,
  RefreshTokenRepository,
} from '../../../auth/application/ports/session/RefreshTokenRepository';
import { Atomic } from '../../../auth/application/ports/utils/Atomic';
import { RefreshToken } from '../../../auth/domain/entities/refresh-token.entity';
import { RefreshTokenReuseError } from '../../../auth/domain/errors/session.errors';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(token: CreateRefreshTokenDTO): Atomic<RefreshToken> {
    const now = Date.now();

    return this.prismaService.refreshToken.create({
      data: {
        jti: token.jti,
        userId: token.userId,
        sessionId: token.sessionId,
        tokenHash: this.hash(token.refreshToken),
        familyId: token.familyId ?? randomUUID(),
        parentTokenId: token.parentTokenId ?? null,
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

  revokeFamily(familyId: string): Atomic<{ count: number }> {
    return this.prismaService.refreshToken.updateMany({
      where: { familyId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  async rotate(
    oldJti: string,
    newToken: CreateRefreshTokenDTO,
  ): Promise<RefreshToken> {
    return this.prismaService.$transaction(async (tx) => {
      // Compare-and-swap: só marca como consumido se ainda estava "vivo".
      // Isso fecha a race condition entre duas chamadas de refresh simultâneas
      // usando o mesmo token.
      const updated = await tx.refreshToken.updateMany({
        where: { jti: oldJti, consumed: false, revoked: false },
        data: { consumed: true, consumedAt: new Date() },
      });

      if (updated.count === 0) {
        throw new RefreshTokenReuseError();
      }

      const now = Date.now();
      return tx.refreshToken.create({
        data: {
          jti: newToken.jti,
          userId: newToken.userId,
          sessionId: newToken.sessionId,
          tokenHash: this.hash(newToken.refreshToken),
          familyId: newToken.familyId!, // sempre repassado pelo SessionService na rotação
          parentTokenId: newToken.parentTokenId ?? null,
          consumed: false,
          consumedAt: null,
          revoked: false,
          revokedAt: null,
          createdAt: new Date(now),
          expiresAt: new Date(now + newToken.expiresIn * 1_000),
        },
      });
    });
  }

  findByJti(jti: string): Atomic<RefreshToken | null> {
    return this.prismaService.refreshToken.findUnique({
      where: { jti },
    });
  }

  revokeBySessionId(sessionId: string): Atomic<{ count: number }> {
    return this.prismaService.refreshToken.updateMany({
      where: { sessionId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  revokeAllByUserId(userId: string): Atomic<{ count: number }> {
    return this.prismaService.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  // -------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------

  private hash(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }
}
