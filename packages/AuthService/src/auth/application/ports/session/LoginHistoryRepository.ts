import { Atomic } from '../utils/Atomic';
import { LoginFailureReason } from '../../../../infra/prisma/generated/enums';
import { LoginHistory } from '../../../domain/entities/login-history.entity';

export type LoginHistorySuccessRecord = Omit<
  LoginHistory,
  'success' | 'createdAt' | 'failureReason' | 'id'
>;

export type LoginHistoryFailureRecord = Omit<
  LoginHistorySuccessRecord,
  'sessionId'
> & {
  failureReason: LoginFailureReason;
};

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
