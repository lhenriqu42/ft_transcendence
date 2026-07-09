export abstract class PasswordResetRepository {
  /**
   * Saves a challenge with tokenHash as a key and userId as a value to the repository.
   *
   * @param tokenHash The hash of the password reset token.
   * @param userId The ID of the user associated with the password reset request.
   * @returns A promise that resolves when the challenge is successfully saved.
   * @throws An error if the save operation fails.
   */
  abstract saveChallenge(tokenHash: string, userId: string): Promise<void>;

  /**
   * Retrieves the userId associated with the given tokenHash from the repository.
   *
   * @param tokenHash The hash of the password reset token.
   * @returns A promise that resolves to the userId if found, or null if not found.
   * @throws An error if the retrieval operation fails.
   */
  abstract getUserIdByTokenHash(tokenHash: string): Promise<string | null>;

  /**
   * Deletes the challenge associated with the given tokenHash from the repository.
   *
   * @param tokenHash The hash of the password reset token.
   * @returns A promise that resolves when the challenge is successfully deleted.
   * @throws An error if the delete operation fails.
   */
  abstract deleteChallenge(tokenHash: string): Promise<void>;
}
