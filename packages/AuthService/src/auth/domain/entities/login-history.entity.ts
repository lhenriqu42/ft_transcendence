import { LoginFailureReason } from '../../../infra/prisma/generated/enums';

export class LoginHistory {
  constructor(
    public readonly id: string,
    public readonly userId: string,
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
    public readonly userAgent: string,
    public readonly riskScore: number,
    public readonly captchaRequired: boolean,
    public readonly mfaRequired: boolean,
    public readonly createdAt: Date,
  ) {}
}
