import { Atomic } from './Atomic';
import { LoginHistory } from '../../domain/entities/login-history.entity';
import { LoginFailureReason } from '../../../infra/prisma/generated/enums';

export interface LoginHistorySuccessRecord {
  userId: string;
  deviceId?: string;
  sessionId?: string;

  ip: string;
  userAgent: string | null;

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

export abstract class LoginHistoryRepository {
  /**
   * Records a successful login attempt in the repository.
   *
   * @param record The details of the successful login attempt.
   * @returns A promise that resolves when the record is successfully created.
   * @throws An error if the creation operation fails.
   */
  abstract recordSuccess(
    record: LoginHistorySuccessRecord,
  ): Atomic<LoginHistory>;

  /**
   * Records a failed login attempt in the repository.
   *
   * @param record The details of the failed login attempt.
   * @returns A promise that resolves when the record is successfully created.
   * @throws An error if the creation operation fails.
   */
  abstract recordFailure(
    record: LoginHistoryFailureRecord,
  ): Atomic<LoginHistory>;
}
