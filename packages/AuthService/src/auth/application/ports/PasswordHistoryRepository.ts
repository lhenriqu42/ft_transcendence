import { PasswordHistory } from '../../domain/entities/password-history.entity';
import { Atomic } from './Atomic';

export abstract class PasswordHistoryRepository {
  /**
   * Saves a new password history entry to the repository.
   *
   * @param entry The password history entry to be saved.
   * @returns A promise that resolves when the entry is successfully saved.
   * @throws An error if the save operation fails.
   */
  abstract save(
    entry: Omit<PasswordHistory, 'id' | 'createdAt'>,
  ): Atomic<PasswordHistory>;
}
