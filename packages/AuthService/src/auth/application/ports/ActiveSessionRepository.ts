export interface ActiveSession {
  id: string;
  userId: string;
  deviceId: string;
  ttlSeconds: number;
}

export abstract class ActiveSessionRepository {
  /**
   * Creates a new active session.
   *
   * @param session The active session to create.
   * @returns A promise that resolves when the session is successfully created.
   * @throws An error if the creation operation fails.
   */
  abstract save(session: ActiveSession): Promise<void>;

  /**
   * Retrieves an active session by its session ID.
   *
   * @param sessionId The ID of the session to retrieve.
   * @returns A promise that resolves to the active session if found, or null if not found.
   * @throws An error if the retrieval operation fails.
   */
  abstract get(sessionId: string): Promise<ActiveSession | null>;

  /**
   * Deletes an active session by its session ID.
   *
   * @param sessionId The ID of the session to delete.
   * @returns A promise that resolves when the session is successfully deleted.
   * @throws An error if the deletion operation fails.
   */
  abstract delete(sessionId: string): Promise<void>;

  /**
   *  Checks if an active session exists by its session ID.
   *
   * @param sessionId The ID of the session to check.
   * @returns A promise that resolves to true if the session exists, or false if it does not exist.
   * @throws An error if the existence check operation fails.
   */
  abstract exists(sessionId: string): Promise<boolean>;

  /**
   * Deletes all active sessions belonging to a user (logout de todos os devices).
   *
   * @param userId The ID of the user whose sessions should be deleted.
   */
  abstract deleteAllByUserId(userId: string): Promise<void>;
}
