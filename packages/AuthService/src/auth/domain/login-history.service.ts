import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../.shared/prisma/prisma.service';
import { LoginFailureReason } from '../../.shared/prisma/generated/enums';

export interface LoginHistorySuccessRecord {
  userId: string;
  deviceId?: string;
  sessionId?: string;

  ip: string;
  userAgent: string;

  riskScore: number;

  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  asn?: number;
  org?: string;
  isp?: string;
  domain?: string;

  captchaRequired: boolean;
  mfaRequired: boolean;
}

export interface LoginHistoryFailureRecord
  extends Omit<LoginHistorySuccessRecord, 'sessionId'> {
  failureReason: LoginFailureReason;
}

@Injectable()
export class LoginHistoryService {
  constructor(private readonly prismaService: PrismaService) {}

  recordSuccess(record: LoginHistorySuccessRecord) {
    return this.prismaService.loginHistory.create({
      data: {
        ...record,
        success: true,
        failureReason: null,
        createdAt: new Date(),
      },
    });
  }

  recordFailure(record: LoginHistoryFailureRecord) {
    return this.prismaService.loginHistory.create({
      data: {
        ...record,
        success: false,
        createdAt: new Date(),
      },
    });
  }

  listHistory() {
    // TODO: NOT IMPLEMENTED
  }
}
