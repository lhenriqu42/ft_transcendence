import { OAuthProviderType } from '../../contracts/auth.contracts';
import { OAuthIdentity } from '../../../domain/entities/oauth-identity.entity';
import { Atomic } from '../utils/Atomic';

export abstract class OAuthIdentityRepository {
  /**
   * Finds an OAuth identity by provider and provider user ID.
   * @param provider The OAuth provider (e.g., 'google', 'facebook').
   * @param providerUserId The unique user ID provided by the OAuth provider.
   * @returns A promise that resolves to the found OAuthIdentity or null if not found.
   */
  abstract find(
    provider: OAuthProviderType,
    providerUserId: string,
  ): Atomic<OAuthIdentity | null>;

  /**
   * Creates a new OAuth identity in the repository.
   * @param identity The OAuthIdentity object to be created.
   * @returns A promise that resolves to the created OAuthIdentity.
   */
  abstract create(identity: OAuthIdentity): Atomic<OAuthIdentity>;

  /**
   * Updates an existing OAuth identity in the repository.
   * @param id The unique identifier of the OAuth identity to be updated.
   * @param identity A partial OAuthIdentity object containing the fields to be updated.
   * @returns A promise that resolves to the updated OAuthIdentity.
   */
  abstract update(
    id: string,
    identity: Partial<OAuthIdentity>,
  ): Atomic<OAuthIdentity>;
}
