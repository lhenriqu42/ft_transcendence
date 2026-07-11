import { OAuthIdentityResume, OAuthTokens } from './OAuthProvider';

export interface PendingLinkData {
  identity: OAuthIdentityResume;
  tokens: OAuthTokens;
  candidateUserId: string;
  candidateEmail: string;
}

export abstract class PendingLinkStore {
  /**
   * Stores a pending link data with a unique token and a time-to-live (TTL) in seconds.
   * @param token - A unique token to identify the pending link data.
   * @param data - The pending link data to be stored.
   * @param opts - Options for storing the data, including TTL in seconds.
   * @returns A promise that resolves when the data is successfully stored.
   */
  abstract set(
    token: string,
    data: PendingLinkData,
    opts: { ttlSeconds: number },
  ): Promise<void>;

  /**
   * Retrieves the pending link data associated with the given token.
   * @param token - The unique token identifying the pending link data.
   * @returns A promise that resolves to the pending link data if found, or null if not found.
   */
  abstract get(token: string): Promise<PendingLinkData | null>;

  /**
   * Deletes the pending link data associated with the given token.
   * @param token - The unique token identifying the pending link data to be deleted.
   * @returns A promise that resolves when the data is successfully deleted.
   */
  abstract delete(token: string): Promise<void>;
}
