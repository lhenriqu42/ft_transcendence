import { Injectable } from '@nestjs/common';

import { OAuthProvider } from '../oauth/OAuthProvider';
import { OAuthProviderType } from '../../contracts/auth.contracts';

import { FortyTwoOAuthProvider } from '../../../../infra/oauth/FortyTwoProvider';
import { GithubOAuthProvider } from '../../../../infra/oauth/GithubProvider';
import { GoogleOAuthProvider } from '../../../../infra/oauth/GoogleProvider';
import { DiscordOAuthProvider } from '../../../../infra/oauth/DiscordProvider';

@Injectable()
export class OAuthProviderFactory {
  constructor(
    private readonly fortyTwo: FortyTwoOAuthProvider,
    private readonly google: GoogleOAuthProvider,
    private readonly github: GithubOAuthProvider,
    private readonly discord: DiscordOAuthProvider,
  ) {}

  get(type: OAuthProviderType): OAuthProvider {
    const providers: Record<OAuthProviderType, OAuthProvider> = {
      ECOLE42: this.fortyTwo,
      GITHUB: this.github,
      GOOGLE: this.google,
      DISCORD: this.discord,
    };

    const provider = providers[type];

    if (!provider) {
      throw new Error(`OAuth provider ${type} not supported`);
    }

    return provider;
  }
}
