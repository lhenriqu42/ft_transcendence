import {
  UserRepository,
  DeviceRepository,
  ChallengePayload,
  ChallengeRepository,
} from './ports';
import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as CI from './contracts/auth.contracts';
import { Device } from '../domain/entities/device.entity';
import { IpInfoService } from './providers/ip-info.service';
import { RiskEngineService } from '../domain/risk-engine.service';

const RISK_SCORE_CAPTCHA_THRESHOLD = 50; // acima disso, exige captcha

@Injectable()
export class ChallengeService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly deviceRepo: DeviceRepository,
    private readonly ipInfoService: IpInfoService,
    private readonly challengeRepo: ChallengeRepository,
    private readonly riskEngineService: RiskEngineService,
  ) {}

  async execute(body: CI.ChallengeRequest): Promise<CI.ChallengeResponse> {
    const [user, ipContext] = await Promise.all([
      this.userRepo.findLoginDataByEmail(body.email),
      this.ipInfoService.lookup(body.ip),
    ]);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.accountLocked) {
      throw new ForbiddenException('Account is temporarily locked');
    }

    let device: Device | null = null;

    if (body.deviceId) {
      device = await this.deviceRepo.findById(user.id, body.deviceId);
    }

    const riskScore = this.riskEngineService.evaluate({
      ipInfo: ipContext,
      userInfo: {
        id: user.id,
        failedLoginCount: user.failedLoginCount,
      },
      requestInfo: {
        userAgent: body.userAgent,
        deviceFingerprint: body.deviceFingerprint,
      },
      deviceInfo: device,
    });

    const requiresCaptcha = riskScore >= RISK_SCORE_CAPTCHA_THRESHOLD;

    //  ----------------------------------- Handle MFA HERE -----------------------------------

    // ----------- Challenge Generation ------------

    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos de vida útil

    const requiresMFA = false; // Placeholder for MFA logic
    const challengePayload: ChallengePayload = {
      user: {
        ...user,
        email: body.email,
      },
      riskScore,
      ipContext,
      requiresCaptcha,
      requiresMFA: requiresMFA,
      deviceId: body.deviceId ?? null,
      userAgent: body.userAgent ?? null,
      deviceFingerprint: body.deviceFingerprint ?? null,
    };

    const challengeId = await this.challengeRepo.save(
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
