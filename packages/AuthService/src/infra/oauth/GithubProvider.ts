import * as arctic from 'arctic';
import { GitHubEmail, GitHubUser } from './types/GitHub';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OAuthIdentity,
  OAuthProvider,
  OAuthTokens,
  STATE_TTL_SECONDS,
} from '../../auth/application/ports';
import { OAuthProviderType } from '../../auth/application/contracts/auth.contracts';
import { RedisOAuthAuthorizationRepository } from '../redis/repositories/RedisOAuthAuthorizationRepository';

@Injectable()
export class GithubOAuthProvider implements OAuthProvider {
  public readonly provider: OAuthProviderType = 'GITHUB';
  private readonly github: arctic.GitHub;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisOauthStateRepo: RedisOAuthAuthorizationRepository,
  ) {
    this.github = new arctic.GitHub(
      this.configService.getOrThrow('GITHUB_CLIENT_ID'),
      this.configService.getOrThrow('GITHUB_CLIENT_SECRET'),
      this.configService.getOrThrow('GITHUB_REDIRECT_URI'),
    );
  }

  async createAuthorizationUrl(): Promise<URL> {
    const state = arctic.generateState();

    await this.redisOauthStateRepo.save(state, {}, STATE_TTL_SECONDS);

    return this.github.createAuthorizationURL(state, ['user:email']);
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
        this.github.validateAuthorizationCode(code),
        this.redisOauthStateRepo.delete(state),
      ]);

      return {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken()
          ? tokens.refreshToken()
          : undefined,
        scopes: tokens.scopes(),
        tokenType: tokens.tokenType(),
      };
    } catch (e) {
      console.error(e);
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
    const [user, emails] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    ]);

    const [userData, emailsData] = await Promise.all([
      user.json() as Promise<GitHubUser>,
      emails.json() as Promise<GitHubEmail[]>,
    ]);

    return {
      provider: this.provider,
      providerUserId: userData.id.toString(),
      email:
        userData.email ??
        emailsData.find((email) => email.primary)?.email ??
        '',
      emailVerified: true,
      username: userData.login,
      displayName: userData.name ?? userData.login,
      avatarUrl: userData.avatar_url,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decodeIdToken(_idToken: string): OAuthIdentity | null {
    return null;
  }
}
