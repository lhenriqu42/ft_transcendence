import * as arctic from 'arctic';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OAuthTokens,
  OAuthProvider,
  OAuthIdentityResume,
  STATE_TTL_SECONDS,
  OAuthStateRepository,
} from '../../auth/application/ports';
import { DiscordIdTokenClaims, DiscordUser } from './types/Discord';
import {
  IntentPath,
  OAuthProviderType,
} from '../../auth/application/contracts/auth.contracts';

@Injectable()
export class DiscordOAuthProvider implements OAuthProvider {
  public readonly provider: OAuthProviderType = 'DISCORD';
  private readonly discord: arctic.Discord;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisOauthStateRepo: OAuthStateRepository,
  ) {
    this.discord = new arctic.Discord(
      this.configService.getOrThrow('DISCORD_CLIENT_ID'),
      this.configService.getOrThrow('DISCORD_CLIENT_SECRET'),
      this.configService.getOrThrow('DISCORD_REDIRECT_URI'),
    );
  }

  async createAuthorizationUrl({ userId, intent }: IntentPath): Promise<URL> {
    const state = arctic.generateState();
    const scopes = ['email', 'identify', 'openid'];

    await this.redisOauthStateRepo.save(
      state,
      { userId, intent, provider: this.provider, codeVerifier: null },
      STATE_TTL_SECONDS,
    );

    return this.discord.createAuthorizationURL(state, null, scopes);
  }

  async validateAuthorizationCode(
    code: string,
    state: string,
  ): Promise<OAuthTokens> {
    if (!(await this.redisOauthStateRepo.find(state))) {
      throw new UnauthorizedException('Invalid or expired state');
    }

    try {
      const [tokens] = await Promise.all([
        this.discord.validateAuthorizationCode(code, null),
        this.redisOauthStateRepo.delete(state),
      ]);

      return {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken()
          ? tokens.refreshToken()
          : undefined,
        expiresAt: tokens.accessTokenExpiresAt(),
        idToken: undefined, // Discord provide an smallest ID token, not a full ID token like Google or Apple, so we set it to undefined
        scopes: tokens.scopes(),
        tokenType: tokens.tokenType(),
      };
    } catch (e) {
      if (e instanceof arctic.OAuth2RequestError) {
        // Invalid authorization code, credentials, or redirect URI
        throw new UnauthorizedException(
          'Invalid credentials, redirect URI, or authorization code',
        );
      }
      if (e instanceof arctic.ArcticFetchError) {
        // Failed to call `fetch()`
        throw new InternalServerErrorException('Failed to fetch user data');
      }
      // Parse error
      throw new InternalServerErrorException('Failed to parse user data');
    }
  }

  async getIdentityResume(accessToken: string): Promise<OAuthIdentityResume> {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = (await response.json()) as DiscordUser;

    return {
      provider: this.provider,
      providerUserId: userData.id,
      email: userData.email,
      emailVerified: userData.verified,
      username: userData.username,
      displayName: userData.global_name,
      avatarUrl: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
    };
  }

  decodeIdToken(idToken: string): OAuthIdentityResume | null {
    const claims = arctic.decodeIdToken(idToken) as DiscordIdTokenClaims;
    console.log('Decoded ID Token Claims:', claims);

    if (!claims) {
      return null;
    }

    return {
      provider: this.provider,
      providerUserId: claims.sub,
      email: '',
      emailVerified: true,
    };
  }
}
