import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OAuthProviderType } from '../../contracts/auth.contracts';
import { OAuthProvider } from '../oauth/OAuthProvider';

import { GithubOAuthProvider } from '../../../../infra/oauth/GithubProvider';
import { GoogleOAuthProvider } from '../../../../infra/oauth/GoogleProvider';
import { DiscordOAuthProvider } from '../../../../infra/oauth/DiscordProvider';
import { FortyTwoOAuthProvider } from '../../../../infra/oauth/FortyTwoProvider';

@Injectable()
export class OAuthProviderFactory {
  private readonly providers: Record<OAuthProviderType, OAuthProvider>;

  constructor(
    private readonly google: GoogleOAuthProvider,
    private readonly github: GithubOAuthProvider,
    private readonly discord: DiscordOAuthProvider,
    private readonly fortyTwo: FortyTwoOAuthProvider,
  ) {
    this.providers = {
      ECOLE42: this.fortyTwo,
      GITHUB: this.github,
      GOOGLE: this.google,
      DISCORD: this.discord,
    };
  }

  get(type: OAuthProviderType): OAuthProvider {
    const provider = this.providers[type];

    if (!provider) {
      throw new InternalServerErrorException(
        `OAuth provider ${type} not supported`,
      );
    }

    return provider;
  }
}
