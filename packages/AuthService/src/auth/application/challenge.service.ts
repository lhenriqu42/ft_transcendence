import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  GeoIPService,
  LoginIpContext,
  RiskEngineService,
  ChallengeStoreService,
} from '../domain';
import { randomUUID } from 'crypto';
import * as CI from '../contracts/auth.contracts';
import { PrismaService } from '../../.shared/prisma/prisma.service';

const RISK_SCORE_CAPTCHA_THRESHOLD = 50; // acima disso, exige captcha
const RISK_SCORE_MFA_THRESHOLD = 40; // acima disso, exige MFA (se disponível)

export interface ChallengePayload {
  user: {
    id: string;
    email: string;
    passwordHash: string;
    accountLocked: boolean;
    failedLoginCount: number;
    deletedAt: Date | null;
  };
  ipContext: LoginIpContext;
  riskScore: number;
  requiresCaptcha: boolean;
  requiresMFA: boolean;
  userAgent: string;
  deviceFingerprint?: string;
}

export class ChallengeService {
  constructor(
    private readonly geoIpService: GeoIPService,
    private readonly prismaService: PrismaService,
    private readonly challengeStore: ChallengeStoreService,
    private readonly riskEngineService: RiskEngineService,
  ) {}
  async execute(body: CI.ChallengeRequest): Promise<CI.ChallengeResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        passwordHash: true,
        accountLocked: true,
        failedLoginCount: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.accountLocked) {
      throw new ForbiddenException('Account is temporarily locked');
    }

    const ipContext = await this.geoIpService.lookup(body.ip);

    const riskScore = await this.riskEngineService.evaluate({
      ipInfo: ipContext,
      userInfo: {
        id: user.id,
        failedLoginCount: user.failedLoginCount,
      },
      requestInfo: {
        userAgent: body.userAgent,
        deviceFingerprint: body.deviceFingerprint,
      },
    });

    const requiresCaptcha =
      riskScore >= RISK_SCORE_CAPTCHA_THRESHOLD || user.failedLoginCount >= 3;

    const mfaCredential = await this.prismaService.mfaCredential.findFirst({
      where: { userId: user.id, enabled: true },
      select: { id: true },
    });

    const requiresMFA =
      !!mfaCredential || riskScore >= RISK_SCORE_MFA_THRESHOLD;

    // ----------- Challenge Generation ------------

    const challengeId = randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos de vida útil

    const challengePayload: ChallengePayload = {
      user: {
        ...user,
        email: body.email,
      },
      riskScore,
      requiresCaptcha,
      requiresMFA,
      userAgent: body.userAgent,
      deviceFingerprint: body.deviceFingerprint,
      ipContext,
    };

    await this.challengeStore.save(
      `challenge:${challengeId}`,
      challengePayload,
      expiresAt,
    );

    return {
      challengeId,
      requiresCaptcha,
      requiresMFA,
      expiresAt,
    };
  }
}
