import { Injectable } from '@nestjs/common';
import * as CI from './contracts/auth.contracts';
import { OAuthProviderFactory } from './ports/utils/OAuthProviderFactory';
import { OAuthIdentity } from './ports';

@Injectable()
export class OAuthCallbackUseCase {
  constructor(private readonly oAuthProviderFactory: OAuthProviderFactory) {}

  async execute(
    body: CI.OAuthCallbackRequest,
  ): Promise<CI.OAuthCallbackResponse> {
    const provider = this.oAuthProviderFactory.get(body.provider);

    console.log(`Executing OAuth callback for provider: ${body.provider}`);

    const result = await provider.validateAuthorizationCode(
      body.code,
      body.state,
    );

    let identity: OAuthIdentity | null = null;
    if (result.idToken) identity = provider.decodeIdToken(result.idToken);
    else identity = await provider.getIdentity(result.accessToken);

    if (!identity) {
      throw new Error('Failed to retrieve user identity from OAuth provider');
    }

    console.log(`Retrieved identity for provider ${body.provider}:`, identity);

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      idToken: result.idToken,
      scopes: result.scopes ?? [],
      identity,
    };
  }
}
