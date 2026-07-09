import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'crypto';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { SignJWT } from 'jose';
import {
  UnitOfWork,
  UserRepository,
  RefreshTokenRepository,
  ActiveSessionRepository,
  SessionHistoryRepository,
} from '../ports';
import {
  SessionMismatchError,
  RefreshTokenReuseError,
  RefreshTokenExpiredError,
  InvalidRefreshTokenError,
} from '../../domain/errors/session.errors';

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

  create(userId: string, deviceId: string) {
    const now = Date.now();
    const sessionId = randomUUID();
    const payload = {
      sub: userId,
      sid: sessionId,
      roles: [], // TODO: roles ainda não estão modeladas no schema
    };

    const { jti, secret, raw: refreshToken } = this.issueRawToken();

    const prismaPromises = [
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
        jti,
        userId,
        sessionId,
        refreshToken: secret,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }),
    ] as const;

    const promises = [
      this.signAccessToken(payload),

      this.activeSessionRepo.save({
        id: sessionId,
        userId,
        deviceId,
        ttlSeconds: ACCESS_TOKEN_TTL_SECONDS,
      }),
    ] as const;

    return { prismaPromises, promises, refreshToken, payload };
  }

  async refresh(sessionId: string, refreshToken: string) {
    const now = Date.now();
    const { jti, secret } = this.parseRawToken(refreshToken);

    const record = await this.refreshTokenRepo.findByJti(jti);
    if (!record) {
      throw new InvalidRefreshTokenError();
    }

    if (record.sessionId !== sessionId) {
      throw new SessionMismatchError();
    }

    if (!this.matchesHash(secret, record.tokenHash)) {
      throw new InvalidRefreshTokenError();
    }

    if (record.revoked) {
      throw new InvalidRefreshTokenError();
    }

    if (record.expiresAt.getTime() <= now) {
      throw new RefreshTokenExpiredError();
    }

    if (record.consumed) {
      // Token já usado sendo reapresentado: sinal de replay/roubo.
      // Revoga a família inteira — inclusive o token que acabou de ser emitido
      // a partir dele, se já existir.
      await this.refreshTokenRepo.revokeFamily(record.familyId);
      throw new RefreshTokenReuseError();
    }

    const next = this.issueRawToken();

    let rotated: RefreshToken;
    try {
      rotated = await this.refreshTokenRepo.rotate(jti, {
        jti: next.jti,
        userId: record.userId,
        sessionId: record.sessionId,
        refreshToken: next.secret,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        familyId: record.familyId,
        parentTokenId: record.id,
      });
    } catch (err) {
      if (err instanceof RefreshTokenReuseError) {
        // Perdeu a corrida (rotate detectou consumo concorrente) — mesma resposta:
        // revoga a família inteira.
        await this.refreshTokenRepo.revokeFamily(record.familyId);
      }
      throw err;
    }

    const payload: AccessTokenPayload = {
      sub: rotated.userId,
      sid: rotated.sessionId,
      roles: [], // TODO: roles ainda não estão modeladas no schema
    };

    const accessToken = await this.signAccessToken(payload);

    return {
      accessToken,
      refreshToken: next.raw,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      sessionId: rotated.sessionId,
    };
  }

  async logout(
    userId: string,
    sessionId: string,
    allDevices = false,
  ): Promise<void> {
    const now = new Date();

    if (allDevices) {
      await Promise.all([
        this.activeSessionRepo.deleteAllByUserId(userId),
        this.uof.runBatch([
          this.refreshTokenRepo.revokeAllByUserId(userId),
          this.sessionHistoryRepo.closeAllByUserId(
            userId,
            now,
            'LOGOUT_ALL_DEVICES',
          ),
        ]),
      ]);
      return;
    }

    const session = await this.activeSessionRepo.get(sessionId);
    if (session && session.userId !== userId) {
      return;
    }

    await Promise.all([
      this.activeSessionRepo.delete(sessionId),
      this.uof.runBatch([
        this.refreshTokenRepo.revokeBySessionId(sessionId),
        this.sessionHistoryRepo.close(sessionId, now, 'LOGOUT'),
      ]),
    ]);
  }

  // -------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------

  private signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.JWTSecret);
  }

  // Token bruto entregue ao cliente = "<jti>.<secret>".
  // O jti permite localizar o registro sem precisar buscar por hash;
  // o secret é a parte comparada contra o tokenHash armazenado.
  private issueRawToken() {
    const jti = randomUUID();
    const secret = randomBytes(32).toString('hex');
    return { jti, secret, raw: `${jti}.${secret}` };
  }

  private parseRawToken(raw: string): { jti: string; secret: string } {
    const separatorIndex = raw.indexOf('.');
    if (separatorIndex <= 0 || separatorIndex === raw.length - 1) {
      throw new InvalidRefreshTokenError();
    }
    return {
      jti: raw.slice(0, separatorIndex),
      secret: raw.slice(separatorIndex + 1),
    };
  }

  private matchesHash(secret: string, storedHash: string): boolean {
    const candidateHash = createHash('sha256').update(secret).digest('hex');
    const a = Buffer.from(candidateHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
