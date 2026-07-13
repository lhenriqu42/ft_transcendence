import { LoginIpContext } from '../ports';
import { Injectable } from '@nestjs/common';
import { SessionService } from './session.service';
import { OAuthProviderType } from '../contracts/auth.contracts';
import { DeviceRepository, LoginHistoryRepository } from '../ports';
import { LoginMethod, MfaMethod } from '../../../infra/prisma/generated/enums';

export interface CompleteLoginParams {
  method: LoginMethod;
  userId: string;
  deviceId: string;
  ipContext: LoginIpContext;
  userAgent: string | null;
  riskScore: number;

  captchaRequired: boolean;
  mfaRequired: boolean;

  oauthProvider?: OAuthProviderType | null;
  oauthIdentityId?: string | null;
  mfaMethod?: MfaMethod | null;
  mfaSuccess?: boolean | null;
}

@Injectable()
export class LoginCompletionService {
  constructor(
    private readonly deviceRepo: DeviceRepository,
    private readonly sessionService: SessionService,
    private readonly loginHistoryRepo: LoginHistoryRepository,
  ) {}

  prepare(params: CompleteLoginParams) {
    const sessionResponse = this.sessionService.create(
      params.userId,
      params.deviceId,
    );

    const prismaPromises = [
      ...sessionResponse.prismaPromises,
      this.deviceRepo.incrementLoginCount(params.deviceId),
      this.loginHistoryRepo.recordSuccess({
        userId: params.userId,
        deviceId: params.deviceId,
        sessionId: sessionResponse.payload.sid,
        method: params.method,
        oauthProvider: params.oauthProvider ?? null,
        oauthIdentityId: params.oauthIdentityId ?? null,
        mfaRequired: params.mfaRequired,
        mfaMethod: params.mfaMethod ?? null,
        mfaSuccess: params.mfaSuccess ?? null,
        ip: params.ipContext.ip,
        userAgent: params.userAgent,
        riskScore: params.riskScore,
        country: params.ipContext.country ?? null,
        city: params.ipContext.city ?? null,
        latitude: params.ipContext.latitude ?? null,
        longitude: params.ipContext.longitude ?? null,
        asn: params.ipContext.connection?.asn ?? null,
        org: params.ipContext.connection?.org ?? null,
        isp: params.ipContext.connection?.isp ?? null,
        domain: params.ipContext.connection?.domain ?? null,
        captchaRequired: params.captchaRequired,
      }),
    ] as const;

    return {
      prismaPromises,
      promises: sessionResponse.promises,
      refreshToken: sessionResponse.refreshToken,
      payload: sessionResponse.payload,
    };
  }
}
