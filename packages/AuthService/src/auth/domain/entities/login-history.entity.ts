import {
  MfaMethod,
  LoginMethod,
  LoginFailureReason,
} from '../../../infra/prisma/generated/enums';
import { OAuthProviderType } from '../../application/contracts/auth.contracts';

export class LoginHistory {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly method: LoginMethod,
    public readonly oauthProvider: OAuthProviderType | null,
    public readonly oauthIdentityId: string | null,
    public readonly mfaRequired: boolean,
    public readonly mfaMethod: MfaMethod | null,
    public readonly mfaSuccess: boolean | null,
    public readonly deviceId: string | null,
    public readonly sessionId: string | null,
    public readonly success: boolean,
    public readonly failureReason: LoginFailureReason | null,
    public readonly ip: string,
    public readonly country: string | null,
    public readonly city: string | null,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly asn: number | null,
    public readonly org: string | null,
    public readonly isp: string | null,
    public readonly domain: string | null,
    public readonly userAgent: string | null,
    public readonly riskScore: number,
    public readonly captchaRequired: boolean,
    public readonly createdAt: Date,
  ) {}
}
