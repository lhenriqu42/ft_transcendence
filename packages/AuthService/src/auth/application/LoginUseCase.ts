import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import * as CI from './contracts/auth.contracts';
import { LoginError } from './exceptions/LoginError';
import { SessionService } from './providers/session.service';
import { LoginFailureReason } from '../../infra/prisma/generated/enums';
import { LoginHistoryRepository } from './ports/LoginHistoryRepository';
import { ChallengeRepository, DeviceRepository, UserRepository } from './ports';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15min
const MAX_FAILED_LOGIN_ATTEMPTS = 5;

@Injectable()
export class LoginService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly deviceRepo: DeviceRepository,
    private readonly sessionService: SessionService,
    private readonly challengeRepo: ChallengeRepository,
    private readonly loginHistoryRepo: LoginHistoryRepository,
  ) {}

  async execute(body: CI.LoginRequest): Promise<CI.LoginResponse> {
    const challenge = await this.challengeRepo.find(body.challengeId);

    if (!challenge) {
      throw new UnauthorizedException('Challenge expired or invalid');
    }

    // Por enquanto nao usando o segundo retorno do createOrincrementLoginCount !!
    const [devicePromise] = await this.deviceRepo.createOrincrementLoginCount({
      userId: challenge.user.id,
      deviceId: challenge.deviceId,
      userAgent: challenge.userAgent,
      fingerprint: challenge.deviceFingerprint,
    });

    const device = await devicePromise;

    try {
      if (challenge.user.accountLocked) {
        throw new LoginError(
          new ForbiddenException('Account is temporarily locked'),
          LoginFailureReason.ACCOUNT_LOCKED,
          challenge,
        );
      }

      // Valida se o email do challenge bate com o email do login
      if (challenge.user.email !== body.email) {
        throw new LoginError(
          new UnauthorizedException('Invalid challenge for this email'),
          LoginFailureReason.INVALID_CHALLENGE_EMAIL,
          challenge,
        );
      }

      // Valida se o risco do challenge exige captcha e se o token foi fornecido
      if (challenge.requiresCaptcha && !body.captchaToken) {
        throw new LoginError(
          new UnauthorizedException('Captcha required but not provided'),
          LoginFailureReason.CAPTCHA_REQUIRED,
          challenge,
        );
      }

      // Valida se o risco do challenge exige MFA e se o código foi fornecido
      if (challenge.requiresMFA && !body.mfaCode) {
        throw new LoginError(
          new UnauthorizedException('MFA required but not provided'),
          LoginFailureReason.MFA_REQUIRED,
          challenge,
        );
      }

      // Valida se o risco do challenge exige MFA e se o código fornecido é válido
      // if (challenge.requiresMFA && body.mfaCode) {
      //   const mfaCredential = await this.prismaService.mfaCredential.findFirst({
      //     where: { userId: challenge.user.id, enabled: true },
      //   });

      //   if (!mfaCredential) {
      //     throw new LoginError(
      //       new UnauthorizedException('MFA required but not configured'),
      //       LoginFailureReason.UNKNOWN,
      //       challenge,
      //     );
      //   }

      //   // Implementar validação real de MFA aqui, por enquanto apenas loga
      //   console.log('Validating MFA code:', body.mfaCode);
      // }

      // Valida se o risco do challenge exige captcha e se o token fornecido é válido
      if (challenge.requiresCaptcha && body.captchaToken) {
        // Implementar validação real de captcha aqui, por enquanto apenas loga
        console.log('Validating captcha token:', body.captchaToken);
      }

      const passwordValid = await argon2.verify(
        challenge.user.passwordHash,
        body.password,
      );

      if (!passwordValid) {
        const failedLoginCount = challenge.user.failedLoginCount + 1;
        const shouldLock = failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS;

        await this.userRepo.update(challenge.user.id, {
          failedLoginCount,
          accountLocked: shouldLock,
        });

        throw new LoginError(
          new UnauthorizedException('Invalid credentials'),
          LoginFailureReason.INVALID_CREDENTIALS,
          challenge,
        );
      }

      // ---------------------------------------------
      //              LOGIN SUCCESS
      // ---------------------------------------------

      const [sessionResponse] = await Promise.all([
        this.sessionService.create(challenge.user.id, device.id),
        this.challengeRepo.delete(body.challengeId),
      ]);

      await this.loginHistoryRepo.recordSuccess({
        userId: challenge.user.id,
        deviceId: device.id,
        sessionId: sessionResponse.payload.sid,
        ip: challenge.ipContext.ip,
        userAgent: challenge.userAgent ?? '',
        riskScore: challenge.riskScore,
        country: challenge.ipContext.country,
        city: challenge.ipContext.city,
        latitude: challenge.ipContext.latitude,
        longitude: challenge.ipContext.longitude,
        asn: challenge.ipContext.connection?.asn,
        org: challenge.ipContext.connection?.org,
        isp: challenge.ipContext.connection?.isp,
        domain: challenge.ipContext.connection?.domain,
        captchaRequired: challenge.requiresCaptcha,
        mfaRequired: challenge.requiresMFA,
      });

      return {
        accessToken: sessionResponse.accessToken,
        refreshToken: sessionResponse.refreshToken,
        sessionId: sessionResponse.payload.sid,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        user: {
          id: challenge.user.id,
          email: challenge.user.email,
          roles: [],
        },
      };
    } catch (error) {
      if (error instanceof LoginError) {
        await this.loginHistoryRepo.recordFailure({
          userId: challenge.user.id,
          deviceId: device.id,
          ip: challenge.ipContext.ip,
          userAgent: challenge.userAgent ?? '',
          riskScore: challenge.riskScore,
          country: challenge.ipContext.country,
          city: challenge.ipContext.city,
          latitude: challenge.ipContext.latitude,
          longitude: challenge.ipContext.longitude,
          asn: challenge.ipContext.connection?.asn,
          org: challenge.ipContext.connection?.org,
          isp: challenge.ipContext.connection?.isp,
          domain: challenge.ipContext.connection?.domain,
          captchaRequired: challenge.requiresCaptcha,
          mfaRequired: challenge.requiresMFA,
          failureReason: error.reason,
        });
      }
      throw error;
    }
  }
}
