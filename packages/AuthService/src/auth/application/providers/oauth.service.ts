import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  OAuthStateData,
  OAuthIdentityResume,
  OAuthProviderFactory,
  OAuthStateRepository,
  OAuthIdentityRepository,
} from '../ports';
import { IntentPath, OAuthProviderType } from '../contracts/auth.contracts';

@Injectable()
export class OAuthService {
  constructor(
    private readonly oAuthStateRepo: OAuthStateRepository,
    private readonly oAuthProviderFactory: OAuthProviderFactory,
    private readonly oAuthIdentityRepo: OAuthIdentityRepository,
  ) {}

  async getAuthorizationUrl(
    providerType: OAuthProviderType,
    params: IntentPath,
  ): Promise<URL> {
    return this.oAuthProviderFactory
      .get(providerType)
      .createAuthorizationUrl(params);
  }

  async getStateData(state: string): Promise<OAuthStateData> {
    const data = await this.oAuthStateRepo.find(state);
    if (!data) {
      throw new UnauthorizedException(`state ${state} not found or expired`);
    }
    return data;
  }

  async getIdentity(type: OAuthProviderType, code: string, state: string) {
    const provider = this.oAuthProviderFactory.get(type);
    const tokens = await provider.validateAuthorizationCode(code, state);

    let identity: OAuthIdentityResume | null = null;
    if (tokens.idToken) identity = provider.decodeIdToken(tokens.idToken);
    else identity = await provider.getIdentityResume(tokens.accessToken);

    if (!identity) {
      throw new InternalServerErrorException(
        'Failed to retrieve user identity from OAuth provider',
      );
    }
    return { tokens, identity };
  }

  findOAuthIdentity(provider: OAuthProviderType, providerUserId: string) {
    return this.oAuthIdentityRepo.find(provider, providerUserId);
  }
}
