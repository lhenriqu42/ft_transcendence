import { Global, Module } from '@nestjs/common';
import { GoogleOAuthProvider } from './GoogleProvider';
import { GithubOAuthProvider } from './GithubProvider';
import { DiscordOAuthProvider } from './DiscordProvider';
import { FortyTwoOAuthProvider } from './FortyTwoProvider';

@Global()
@Module({
  providers: [
    GithubOAuthProvider,
    GoogleOAuthProvider,
    DiscordOAuthProvider,
    FortyTwoOAuthProvider,
  ],
  exports: [
    GithubOAuthProvider,
    GoogleOAuthProvider,
    DiscordOAuthProvider,
    FortyTwoOAuthProvider,
  ],
})
export class OAuthModule {}
