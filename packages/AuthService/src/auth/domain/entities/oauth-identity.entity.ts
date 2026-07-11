import { OAuthProviderType } from '../../application/contracts/auth.contracts';

export class OAuthIdentity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: OAuthProviderType,
    public readonly providerUserId: string,
    public readonly email: string | null,
    public readonly emailVerified: boolean | null,
    public readonly username: string | null,
    public readonly displayName: string | null,
    public readonly avatarUrl: string | null,
    public readonly providerAccessToken: string | null,
    public readonly providerRefreshToken: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
