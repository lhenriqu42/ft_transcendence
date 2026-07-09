import * as arctic from 'arctic';
import {
  OAuthTokens,
  OAuthProvider,
  OAuthIdentity,
  STATE_TTL_SECONDS,
} from '../../auth/application/ports';
import { FortyTwoUser } from './types/42';
import { ConfigService } from '@nestjs/config';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { OAuthProviderType } from '../../auth/application/contracts/auth.contracts';
import { RedisOAuthAuthorizationRepository } from '../redis/repositories/RedisOAuthAuthorizationRepository';

@Injectable()
export class FortyTwoOAuthProvider implements OAuthProvider {
  public readonly provider: OAuthProviderType = 'ECOLE42';
  private readonly fortyTwo: arctic.FortyTwo;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisOauthStateRepo: RedisOAuthAuthorizationRepository,
  ) {
    this.fortyTwo = new arctic.FortyTwo(
      this.configService.getOrThrow('FORTYTWO_CLIENT_ID'),
      this.configService.getOrThrow('FORTYTWO_CLIENT_SECRET'),
      this.configService.getOrThrow('FORTYTWO_REDIRECT_URI'),
    );
  }

  async createAuthorizationUrl(): Promise<URL> {
    const state = arctic.generateState();

    await this.redisOauthStateRepo.save(state, {}, STATE_TTL_SECONDS); // 5 minutes

    return this.fortyTwo.createAuthorizationURL(state, ['public']);
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
        this.fortyTwo.validateAuthorizationCode(code),
        this.redisOauthStateRepo.delete(state),
      ]);

      return {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken()
          ? tokens.refreshToken()
          : undefined,
        expiresAt: tokens.accessTokenExpiresAt(),
        scopes: tokens.scopes(),
        tokenType: tokens.tokenType(),
      };
    } catch (e) {
      console.log(e);
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

  async getIdentity(accessToken: string): Promise<OAuthIdentity> {
    const response = await fetch('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const user = (await response.json()) as FortyTwoUser;

    return {
      provider: this.provider,
      providerUserId: user.id.toString(),
      email: user.email,
      emailVerified: true,
      username: user.login,
      displayName: user.usual_full_name,
      avatarUrl: user.image.versions.medium,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decodeIdToken(_idToken: string): OAuthIdentity | null {
    return null;
  }
}
