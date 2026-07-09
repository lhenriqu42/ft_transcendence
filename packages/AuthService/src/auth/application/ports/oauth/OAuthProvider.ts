import {
  OAuthIdentity as OAuthIdentityContract,
  OAuthProviderType,
} from '../../contracts/auth.contracts';

export type OAuthIdentity = OAuthIdentityContract;

export interface OAuthTokens {
  accessToken: string;

  refreshToken?: string;

  expiresAt?: Date;

  idToken?: string;

  scopes?: string[];

  tokenType: string;
}

export const STATE_TTL_SECONDS = 5 * 60; // 5 minutes

export abstract class OAuthProvider {
  abstract readonly provider: OAuthProviderType;

  /**
   * Creates an authorization URL for the OAuth provider. This URL is used to redirect users to the provider's login page.
   * @returns A URL object representing the authorization URL.
   */
  abstract createAuthorizationUrl(): Promise<URL>;

  /**   * Validates the provided authorization code and state, and retrieves the corresponding OAuth tokens.
   * @param code The authorization code received from the OAuth provider after user authentication.
   * @param state The state parameter used to prevent CSRF attacks, which should match the one sent in the initial request.
   * @returns A promise that resolves to an OAuthTokens object containing access and refresh tokens.
   * @throws An error if the validation fails or if the tokens cannot be retrieved.
   */
  abstract validateAuthorizationCode(
    code: string,
    state: string,
  ): Promise<OAuthTokens>;

  /**
   * Retrieves the identity of the user associated with the provided OAuth tokens.
   * @param tokens The OAuth tokens obtained after successful authentication.
   * @returns A promise that resolves to an OAuthIdentity object containing user information.
   */
  abstract getIdentity(accessToken: string): Promise<OAuthIdentity>;

  /**
   * Decodes the provided ID token to extract user identity information.
   * @param idToken The ID token to decode.
   * @returns An OAuthIdentity object containing user information, or null if the token is invalid or cannot be decoded.
   */
  abstract decodeIdToken(idToken: string): OAuthIdentity | null;
}
