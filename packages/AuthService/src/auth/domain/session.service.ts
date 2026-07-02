import Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REDIS } from '../../.shared/redis/session.redis';
import { PrismaService } from '../../.shared/prisma/prisma.service';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { SignJWT } from 'jose';
import { ConfigService } from '@nestjs/config';

const SESSION_TTL_SECONDS = 30 * 60; // 30min, espelha o TTL do Redis
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dias
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15min

interface AccessTokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  roles: string[];
}

@Injectable()
export class SessionService {
  constructor(
    @Inject(SESSION_REDIS) private readonly redis: Redis,
    private readonly prismaService: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, deviceId: string) {
    const sessionId = randomUUID();

    await this.prismaService.session.create({
      data: {
        id: sessionId,
        userId: userId,
        deviceId: deviceId,
        createdAt: new Date(),
      },
    });
    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify({ userId, deviceId }),
      'EX',
      SESSION_TTL_SECONDS,
    );

    const refreshToken = await this.issueRefreshToken({
      userId: userId,
      sessionId,
      familyId: randomUUID(), // nova família de rotation
      parentTokenId: null,
    });

    const payload = {
      sub: userId,
      sid: sessionId,
      roles: [], // TODO: roles ainda não estão modeladas no schema
    };

    const accessToken = await this.signAccessToken(payload);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken, payload };
  }

  // -------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------

  private async issueRefreshToken(params: {
    userId: string;
    sessionId: string;
    familyId: string;
    parentTokenId: string | null;
  }): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prismaService.refreshToken.create({
      data: {
        jti: randomUUID(),
        userId: params.userId,
        sessionId: params.sessionId,
        tokenHash,
        familyId: params.familyId,
        parentTokenId: params.parentTokenId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    return rawToken;
  }

  private async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    const secret = new TextEncoder().encode(
      this.config.getOrThrow<string>('JWT_SECRET'),
    );

    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(secret);
  }
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
