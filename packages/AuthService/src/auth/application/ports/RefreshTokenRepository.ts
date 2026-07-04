import { Atomic } from './Atomic';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';

export interface CreateRefreshTokenDTO {
  userId: string;
  sessionId: string;
  refreshToken: string;
  expiresIn: number; // Expiration time of the refresh token in seconds since now.
}

export abstract class RefreshTokenRepository {
  /**
   * Creates a new refresh token in the repository.
   *
   * @param token The refresh token to be created.
   * @returns A promise that resolves to the raw token.
   * @throws An error if the creation operation fails.
   */
  abstract create(token: CreateRefreshTokenDTO): Atomic<RefreshToken>;

  /**
   * Deletes a refresh token from the repository.
   *
   * @param token The refresh token to be deleted.
   * @returns A promise that resolves when the token is successfully deleted.
   * @throws An error if the delete operation fails.
   */
  abstract delete(token: RefreshToken): Atomic<RefreshToken>;

  /**
   * Marks a refresh token as consumed in the repository.
   *
   * @param jti The unique identifier of the refresh token to be consumed.
   * @returns A promise that resolves when the token is successfully marked as consumed.
   * @throws An error if the consume operation fails or if the token does not exist.
   */
  abstract consume(jti: string): Atomic<RefreshToken>;

  /**
   * Marks a refresh token as revoked in the repository.
   *
   * @param jti The unique identifier of the refresh token to be revoked.
   * @returns A promise that resolves when the token is successfully marked as revoked.
   * @throws An error if the revoke operation fails or if the token does not exist.
   */
  abstract revoke(jti: string): Atomic<RefreshToken>;

  /**
   * Finds a refresh token by its unique identifier (jti).
   *
   * @param jti The unique identifier of the refresh token to find.
   * @returns A promise that resolves to the found refresh token entity or null if not found.
   * @throws An error if the query operation fails.
   */
  abstract findByJti(jti: string): Atomic<RefreshToken | null>;
}
