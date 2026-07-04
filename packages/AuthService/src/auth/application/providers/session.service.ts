import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { SignJWT } from 'jose';
import {
  UserRepository,
  RefreshTokenRepository,
  ActiveSessionRepository,
  SessionHistoryRepository,
} from '../ports';
import { UnitOfWork } from '../ports/unit-of-work';

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dias
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15min

interface AccessTokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  roles: string[];
}

@Injectable()
export class SessionService {
  private readonly JWTSecret: Uint8Array;
  constructor(
    private readonly uof: UnitOfWork,
    private readonly config: ConfigService,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly activeSessionRepo: ActiveSessionRepository,
    private readonly sessionHistoryRepo: SessionHistoryRepository,
  ) {
    this.JWTSecret = new TextEncoder().encode(
      this.config.getOrThrow<string>('JWT_SECRET'),
    );
  }

  async create(userId: string, deviceId: string) {
    const now = Date.now();
    const sessionId = randomUUID();
    const payload = {
      sub: userId,
      sid: sessionId,
      roles: [], // TODO: roles ainda não estão modeladas no schema
    };
    const refreshToken = randomBytes(32).toString('hex');

    const accessToken = await this.signAccessToken(payload);

    await this.uof.runBatch([
      this.sessionHistoryRepo.save({
        id: sessionId,
        userId,
        deviceId,
        createdAt: new Date(now),
      }),

      this.userRepo.update(userId, {
        failedLoginCount: 0,
        lastLoginAt: new Date(now),
      }),

      this.refreshTokenRepo.create({
        userId,
        sessionId,
        refreshToken,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }),
    ]);

    await this.activeSessionRepo.save({
      id: sessionId,
      userId,
      deviceId,
      ttlSeconds: ACCESS_TOKEN_TTL_SECONDS,
    });

    return { accessToken, refreshToken, payload };
  }

  // -------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------

  private async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.JWTSecret);
  }
}
