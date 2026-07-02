import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import type { Redis } from 'ioredis';
import { LoginFailureReason } from '../.shared/prisma/generated/enums';
import * as CI from './contracts/auth.contracts';
import { PrismaService } from '../.shared/prisma/prisma.service';
import { SESSION_REDIS } from '../.shared/redis/session.redis';

// ---- Config estática da v1 (mover pra ConfigService/.env quando fizer sentido) ----
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15min
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dias
const SESSION_TTL_SECONDS = 30 * 60; // 30min, espelha o TTL do Redis
const MAX_FAILED_LOGIN_ATTEMPTS = 5;

const RISK_SCORE_CAPTCHA_THRESHOLD = 50; // acima disso, exige captcha
const RISK_SCORE_MFA_THRESHOLD = 40; // acima disso, exige MFA (se disponível)

interface AccessTokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  roles: string[];
}

enum RiskValues {
  // --- CATEGORIA 1: DADOS AUSENTES OU INCOMPLETOS (Sinal de automação/bot) ---
  MISSING_FINGERPRINT = 20,
  MISSING_USER_AGENT = 25,
  MISSING_IP = 30,

  // --- CATEGORIA 2: ANOMALIAS DE CONTEXTO (Mudanças suspeitas) ---
  NEW_DEVICE = 15, // Primeiro login vindo de um fingerprint novo
  NEW_COUNTRY = 40, // País diferente do padrão habitual do usuário
  NEW_CITY = 16, // Cidade diferente, mas no mesmo país
  SUSPICIOUS_ASN = 35, // Conexão vinda de um provedor suspeito (ex: data center/VPN comercial)

  // --- CATEGORIA 3: HISTÓRICO E COMPORTAMENTO (Ações recentes na conta) ---
  RECENT_FAILED_LOGINS_LOW = 10, // 1 a 3 tentativas falhas recentes
  RECENT_FAILED_LOGINS_HIGH = 31, // Mais de 3 tentativas falhas recentes (alerta de brute-force)
  PASSWORD_RECENTLY_CHANGED = 21, // Login logo após troca de senha em outro contexto

  // --- CATEGORIA 4: REGRAS CRÍTICAS (Gatilhos imediatos de fraude) ---
  IMPOSSIBLE_TRAVEL = 80, // Login no Brasil e 15 minutos depois na Europa (distância física impossível)
  IP_BLACK_LISTED = 75, // IP listado em bases de spam, botnets ou redes Tor conhecido
  REUSE_REFRESH_TOKEN = 90, // Tentativa de usar um Refresh Token que já foi consumido (indício de roubo de sessão)
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly config: ConfigService,
    @Inject(SESSION_REDIS) private readonly redis: Redis,
  ) {}

  async challenge(body: CI.ChallengeRequest): Promise<CI.ChallengeResponse> {
    // ------------ User Validation ------------

    const user = await this.prismaService.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        accountLocked: true,
        failedLoginCount: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log('user', user);
    if (user.accountLocked) {
      throw new ForbiddenException('Account is temporarily locked');
    }

    // ------------ RiskScore Calculation ------------
    let riskScore = 0;

    if (!body.ip) riskScore += RiskValues.MISSING_IP;
    if (!body.userAgent) riskScore += RiskValues.MISSING_USER_AGENT;
    if (!body.deviceFingerprint) riskScore += RiskValues.MISSING_FINGERPRINT;

    console.log('riskScore after missing data checks', riskScore);

    if (body.deviceFingerprint) {
      console.log('checking device fingerprint for user', user.id);
      const deviceExists = await this.prismaService.device.findUnique({
        where: {
          userId_fingerprintHash: {
            userId: user.id,
            fingerprintHash: createHash('sha256')
              .update(body.deviceFingerprint)
              .digest('hex'),
          },
        },
        select: { id: true },
      });

      if (!deviceExists) {
        riskScore += RiskValues.NEW_DEVICE;
        console.log('new device detected, riskScore updated to', riskScore);
      }
    }

    console.log('final riskScore after device check', riskScore);

    // Adiciona risco baseado no histórico de falhas brutas atuais do usuário
    if (user.failedLoginCount > 0) {
      riskScore +=
        user.failedLoginCount >= 3
          ? RiskValues.RECENT_FAILED_LOGINS_HIGH
          : RiskValues.RECENT_FAILED_LOGINS_LOW;
    }

    console.log('final riskScore after failed login count check', riskScore);

    // Normaliza o score máximo em 100
    riskScore = Math.min(riskScore, 100);

    // ------------ Decisões de Segurança (Regras de Negócio) ------------
    const requiresCaptcha =
      riskScore >= RISK_SCORE_CAPTCHA_THRESHOLD || user.failedLoginCount >= 3;

    // Verifica se o usuário possui MFA ativo no banco
    const mfaCredential = await this.prismaService.mfaCredential.findFirst({
      where: { userId: user.id, enabled: true },
      select: { id: true },
    });

    // Exige MFA se ele estiver ativo ou se o risco contextual for médio/alto
    const requiresMFA =
      !!mfaCredential || riskScore >= RISK_SCORE_MFA_THRESHOLD;

    // ----------- Challenge Generation & Cache ------------
    const challengeId = randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos de vida útil

    // Criamos o payload que o método `login` precisará validar na Etapa 2.
    // Guardamos no Redis com TTL nativo de 5 minutos.
    const challengePayload = {
      userId: user.id,
      email: body.email,
      riskScore,
      requiresCaptcha,
      requiresMFA,
      ip: body.ip,
      userAgent: body.userAgent,
      deviceFingerprint: body.deviceFingerprint,
    };
    console.log('challengePayload', challengePayload);
    console.log('redis key', `challenge:${challengeId}`);
    // Operação atômica MSET/EXPR no Redis para performance máxima
    await this.redis.set(
      `challenge:${challengeId}`,
      JSON.stringify(challengePayload),
      'EX',
      300, // 5 minutos em segundos
    );
    console.log('challenge stored in Redis with TTL of 5 minutes');

    return {
      challengeId,
      requiresCaptcha,
      requiresMFA,
      expiresAt,
    };
  }

  async login(body: CI.LoginRequest): Promise<CI.LoginResponse> {
    // TODO: validar body.challengeId contra o que createChallenge emitiu
    // (existe? não expirou? captcha/mfa exigidos foram satisfeitos?)

    const user = await this.prismaService.user.findUnique({
      where: { email: body.email },
    });

    // Não revela se o problema foi email inexistente ou senha errada
    // (evita user enumeration). Também não dá pra logar em login_history
    // aqui porque a tabela exige user_id not null.
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.accountLocked) {
      await this.recordLoginHistory({
        userId: user.id,
        success: false,
        failureReason: LoginFailureReason.ACCOUNT_LOCKED,
        ip: body.ip,
        userAgent: body.userAgent,
      });
      throw new ForbiddenException('Account locked');
    }

    const passwordValid = await argon2.verify(user.passwordHash, body.password);

    if (!passwordValid) {
      const failedLoginCount = user.failedLoginCount + 1;
      const shouldLock = failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS;

      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount,
          accountLocked: shouldLock,
        },
      });

      await this.recordLoginHistory({
        userId: user.id,
        success: false,
        failureReason: LoginFailureReason.INVALID_PASSWORD,
        ip: body.ip,
        userAgent: body.userAgent,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: se user tiver MFA habilitado (mfa_credentials.enabled = true) e
    // body.mfaCode não bater, retornar/lançar erro pedindo MFA aqui.

    // ---------------------------------------------
    //              LOGIN SUCCESS
    // ---------------------------------------------
    const device = await this.findOrCreateDevice(
      user.id,
      body.ip,
      body.userAgent,
    );

    const sessionId = randomUUID();

    await this.prismaService.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        deviceId: device.id,
        createdAt: new Date(),
      },
    });

    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify({ userId: user.id, deviceId: device.id }),
      'EX',
      SESSION_TTL_SECONDS,
    );

    const refreshToken = await this.issueRefreshToken({
      userId: user.id,
      sessionId,
      familyId: randomUUID(), // nova família de rotation
      parentTokenId: null,
    });

    const accessToken = await this.signAccessToken({
      sub: user.id,
      sid: sessionId,
      roles: [], // TODO: roles ainda não estão modeladas no schema
    });

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lastLoginAt: new Date() },
    });

    await this.recordLoginHistory({
      userId: user.id,
      deviceId: device.id,
      sessionId,
      success: true,
      ip: body.ip,
      userAgent: body.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        roles: [],
      },
    };
  }

  // async refresh(body: CI.RefreshRequest): Promise<CI.RefreshResponse> {
  //   const tokenHash = this.hashToken(body.refreshToken);

  //   const refreshTokenRecord = await this.prismaService.refreshToken.findFirst({
  //     where: { tokenHash, sessionId: body.sessionId },
  //   });

  //   if (!refreshTokenRecord) {
  //     throw new UnauthorizedException('Invalid refresh token');
  //   }

  //   if (
  //     refreshTokenRecord.revoked ||
  //     refreshTokenRecord.expiresAt < new Date()
  //   ) {
  //     throw new UnauthorizedException('Refresh token expired or revoked');
  //   }

  //   const session = await this.prismaService.session.findUnique({
  //     where: { id: body.sessionId },
  //   });

  //   if (!session || session.revokedAt) {
  //     throw new UnauthorizedException('Session revoked');
  //   }

  //   // TODO: comparar body.ip / body.userAgent com o device da sessão e,
  //   // se mudar de forma suspeita, forçar reauth em vez de só seguir.

  //   // v1 simples: apenas valida e estende o token existente (sem trocar o
  //   // valor), já que RefreshResponse hoje não devolve um novo refreshToken
  //   // pro client guardar. Quando quiser rotation single-use de verdade:
  //   //   1. marcar refreshTokenRecord como consumed
  //   //   2. criar um novo refresh_tokens com parentTokenId = refreshTokenRecord.id
  //   //   3. adicionar `refreshToken` no RefreshResponse pra devolver o novo valor
  //   //   4. se um token já consumido for reapresentado, é sinal de reuse:
  //   //      revogar a família inteira (todos com o mesmo family_id) + a sessão
  //   await this.prismaService.refreshToken.update({
  //     where: { id: refreshTokenRecord.id },
  //     data: { lastUsedAt: new Date() },
  //   });

  //   // sessão ainda ativa: renova o TTL do estado vivo no Redis
  //   await this.redis.expire(`session:${body.sessionId}`, SESSION_TTL_SECONDS);

  //   const accessToken = await this.signAccessToken({
  //     sub: session.userId,
  //     sid: session.id,
  //     roles: [],
  //   });

  //   return {
  //     accessToken,
  //     expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  //   };
  // }

  async logout(body: CI.LogoutRequest): Promise<void> {
    if (body.allDevices) {
      const activeSessions = await this.prismaService.session.findMany({
        where: { userId: body.userId, revokedAt: null },
        select: { id: true },
      });

      await this.prismaService.session.updateMany({
        where: { userId: body.userId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'LOGOUT_ALL_DEVICES' },
      });

      await this.prismaService.refreshToken.updateMany({
        where: { userId: body.userId, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });

      if (activeSessions.length > 0) {
        await this.redis.del(...activeSessions.map((s) => `session:${s.id}`));
      }

      return;
    }

    const session = await this.prismaService.session.findUnique({
      where: { id: body.sessionId },
    });

    // sessão não existe ou não pertence ao usuário: trata como já deslogado
    if (!session || session.userId !== body.userId) {
      return;
    }

    await this.prismaService.session.update({
      where: { id: body.sessionId },
      data: { revokedAt: new Date(), revokedReason: 'LOGOUT' },
    });

    await this.prismaService.refreshToken.updateMany({
      where: { sessionId: body.sessionId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });

    await this.redis.del(`session:${body.sessionId}`);
  }

  async register(body: CI.RegisterRequest): Promise<CI.RegisterResponse> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ForbiddenException('Account already registered');
    }

    const passwordHash = await argon2.hash(body.password);

    const newUser = await this.prismaService.user.create({
      data: {
        email: body.email,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      userId: newUser.id,
    };
  }
  // ---------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------

  private async findOrCreateDevice(
    userId: string,
    ip: string,
    userAgent: string,
  ) {
    // TODO: fingerprint simplificado (só userAgent). Idealmente incorporar
    // um device-id gerado no client (cookie/localStorage) pra não colidir
    // usuários com o mesmo browser/versão.
    const fingerprintHash = createHash('sha256')
      .update(userAgent)
      .digest('hex');

    const existing = await this.prismaService.device.findUnique({
      where: { userId_fingerprintHash: { userId, fingerprintHash } },
    });

    if (existing) {
      return this.prismaService.device.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date(), loginCount: { increment: 1 } },
      });
    }

    return this.prismaService.device.create({
      data: {
        userId,
        fingerprintHash,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
  }

  private hashToken(token: string): string {
    // sha256 é suficiente aqui: o valor já é aleatório de alta entropia
    // (diferente de senha, não precisa de argon2/bcrypt custoso)
    return createHash('sha256').update(token).digest('hex');
  }

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

  private async recordLoginHistory(params: {
    userId: string;
    deviceId?: string;
    sessionId?: string;
    success: boolean;
    failureReason?: LoginFailureReason;
    ip: string;
    userAgent: string;
  }) {
    // TODO: preencher country/city/asn (geolocalização de IP) e risk_score
    return this.prismaService.loginHistory.create({
      data: {
        userId: params.userId,
        deviceId: params.deviceId,
        sessionId: params.sessionId,
        success: params.success,
        failureReason: params.failureReason,
        ip: params.ip,
        userAgent: params.userAgent,
        createdAt: new Date(),
      },
    });
  }
}
