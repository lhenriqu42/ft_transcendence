import {
  DeviceService,
  SessionService,
  ChallengeStoreService,
  LoginHistoryService,
} from '../domain';
import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import * as CI from '../contracts/auth.contracts';
import { LoginError } from '../exceptions/LoginError';
import { LoginFailureReason } from '../../.shared/prisma/generated/enums';
import { PrismaService } from '../../.shared/prisma/prisma.service';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15min
const MAX_FAILED_LOGIN_ATTEMPTS = 5;

@Injectable()
export class LoginService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly deviceService: DeviceService,
    private readonly sessionService: SessionService,
    private readonly challengeStore: ChallengeStoreService,
    private readonly loginHistoryService: LoginHistoryService,
  ) {}

  async execute(body: CI.LoginRequest): Promise<CI.LoginResponse> {
    const challenge = await this.challengeStore.find(body.challengeId);

    if (!challenge) {
      throw new UnauthorizedException('Challenge expired or invalid');
    }

    const device = await this.deviceService.findOrCreateDevice(
      challenge.user.id,
      body.ip,
      body.userAgent,
    );

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
      if (challenge.requiresMFA && body.mfaCode) {
        const mfaCredential = await this.prismaService.mfaCredential.findFirst({
          where: { userId: challenge.user.id, enabled: true },
        });

        if (!mfaCredential) {
          throw new LoginError(
            new UnauthorizedException('MFA required but not configured'),
            LoginFailureReason.UNKNOWN,
            challenge,
          );
        }

        // Implementar validação real de MFA aqui, por enquanto apenas loga
        console.log('Validating MFA code:', body.mfaCode);
      }

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

        await this.prismaService.user.update({
          where: { id: challenge.user.id },
          data: {
            failedLoginCount,
            accountLocked: shouldLock,
          },
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

      await this.challengeStore.delete(body.challengeId);

      const sessionResponse = await this.sessionService.create(
        challenge.user.id,
        device.id,
      );

      await this.loginHistoryService.recordSuccess({
        userId: challenge.user.id,
        deviceId: device.id,
        sessionId: sessionResponse.payload.sid,
        ip: body.ip,
        userAgent: body.userAgent,
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
        await this.loginHistoryService.recordFailure({
          userId: challenge.user.id,
          deviceId: device.id,
          ip: body.ip,
          userAgent: body.userAgent,
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
