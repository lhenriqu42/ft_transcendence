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
  STATE_TTL_SECONDS,
  OAuthIdentityResume,
  OAuthStateRepository,
} from '../../auth/application/ports';
import { GoogleIdTokenClaims, GoogleUser } from './types/Google';
import {
  IntentPath,
  OAuthProviderType,
} from '../../auth/application/contracts/auth.contracts';

@Injectable()
export class GoogleOAuthProvider implements OAuthProvider {
  public readonly provider: OAuthProviderType = 'GOOGLE';
  private readonly google: arctic.Google;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisOauthStateRepo: OAuthStateRepository,
  ) {
    this.google = new arctic.Google(
      this.configService.getOrThrow('GOOGLE_CLIENT_ID'),
      this.configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
      this.configService.getOrThrow('GOOGLE_REDIRECT_URI'),
    );
  }

  async createAuthorizationUrl(path: IntentPath): Promise<URL> {
    const { ip, deviceId, userId, intent, userAgent, deviceFingerprint } = path;

    const state = arctic.generateState();
    const codeVerifier = arctic.generateCodeVerifier();
    const scopes = ['openid', 'profile', 'email'];

    await this.redisOauthStateRepo.save(
      state,
      {
        ip,
        intent,
        userId,
        deviceId,
        userAgent,
        codeVerifier,
        deviceFingerprint,
        provider: this.provider,
      },
      STATE_TTL_SECONDS,
    );

    return this.google.createAuthorizationURL(state, codeVerifier, scopes);
  }

  async validateAuthorizationCode(
    code: string,
    state: string,
  ): Promise<OAuthTokens> {
    const stateData = await this.redisOauthStateRepo.find(state);
    if (!stateData || !stateData.codeVerifier) {
      throw new Error('Invalid or expired state');
    }

    try {
      const [tokens] = await Promise.all([
        this.google.validateAuthorizationCode(code, stateData.codeVerifier),
        this.redisOauthStateRepo.delete(code),
      ]);
      return {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken()
          ? tokens.refreshToken()
          : undefined,
        expiresAt: tokens.accessTokenExpiresAt(),
        idToken: tokens.idToken(),
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
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const user = (await response.json()) as GoogleUser;

    return {
      provider: this.provider,
      providerUserId: user.sub,
      email: user.email,
      emailVerified: user.email_verified,
      username: user.name,
    };
  }

  decodeIdToken(idToken: string): OAuthIdentityResume | null {
    const claims = arctic.decodeIdToken(idToken) as GoogleIdTokenClaims;
    console.log('Decoded ID Token Claims:', claims);

    if (!claims) {
      return null;
    }

    return {
      provider: this.provider,
      providerUserId: claims.sub,
      email: claims.email,
      emailVerified: claims.email_verified,
      username: claims.name,
    };
  }
}
