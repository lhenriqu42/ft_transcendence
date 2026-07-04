import { Session } from '../../domain/entities/session.entity';
import { Atomic } from './Atomic';

export abstract class SessionHistoryRepository {
  /**
   * Saves a new session record in the repository.
   *
   * @param session The session entity to be saved.
   * @returns A promise that resolves when the session is successfully saved.
   * @throws An error if the save operation fails.
   */
  abstract save(
    session: Omit<Session, 'revokedAt' | 'revokedReason'>,
  ): Atomic<Session>;

  /**
   * Finds all sessions associated with a specific user ID.
   *
   * @param userId The ID of the user whose sessions are to be retrieved.
   * @returns A promise that resolves to an array of session entities.
   * @throws An error if the query operation fails.
   */
  abstract findByUserId(userId: string): Atomic<Session[]>;

  /**
   * Finds a session by its unique ID.
   *
   * @param id The unique ID of the session to be retrieved.
   * @returns A promise that resolves to the session entity if found, or null if not found.
   * @throws An error if the query operation fails.
   */
  abstract findById(id: string): Atomic<Session | null>;
}
