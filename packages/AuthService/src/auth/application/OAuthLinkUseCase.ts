import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  OAuthIdentityRepository,
  OAuthIdentityResume,
  OAuthTokens,
  UserRepository,
} from './ports';
import { OAuthService } from './providers/oauth.service';

interface Params {
  prevUID: string | null;
  currUID: string | null;
  info: { identity: OAuthIdentityResume; tokens: OAuthTokens };
}
import * as CI from './contracts/auth.contracts';

@Injectable()
export class OAuthLinkUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly oAuthService: OAuthService,
    private readonly oAuthIdentityRepo: OAuthIdentityRepository,
  ) {}

  async execute({
    prevUID,
    currUID,
    info,
  }: Params): Promise<CI.OAuthLinkPathResponse> {
    const { identity, tokens } = info;
    if (!currUID) {
      throw new UnauthorizedException('currentUserId required for link');
    }

    if (!prevUID || prevUID !== currUID) {
      throw new UnauthorizedException(
        'session mismatch: link was started by a different user',
      );
    }

    const existingOAuth = await this.oAuthService.findOAuthIdentity(
      identity.provider,
      identity.providerUserId,
    );

    // Ja existe identidade ligada a um usuário
    if (existingOAuth) {
      if (existingOAuth.userId !== currUID) {
        throw new ConflictException(
          'This provider account is already linked to another user',
        );
      }

      // já linkado ao mesmo usuário — idempotente, só atualiza tokens/perfil
      const [user] = await Promise.all([
        this.userRepo.findById(existingOAuth.userId),
        this.oAuthIdentityRepo.update(existingOAuth.id, {
          email: identity.email,
          username: identity.username,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
          emailVerified: identity.emailVerified,
          providerAccessToken: tokens.accessToken,
          providerRefreshToken: tokens.refreshToken,
          updatedAt: new Date(),
        }),
      ]);

      if (!user) {
        throw new InternalServerErrorException(
          `User not found for link (userId: ${existingOAuth.userId})`,
        );
      }

      return {
        intent: 'link',
        success: true,
      };
    }

    // identidade nova -> vincula ao usuário logado (currUID)
    const user = await this.userRepo.findById(currUID);
    if (!user) {
      throw new InternalServerErrorException(
        `User not found for link (userId: ${currUID})`,
      );
    }

    const now = new Date();
    await this.oAuthIdentityRepo.create({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      providerAccessToken: tokens.accessToken,
      providerRefreshToken: tokens.refreshToken ?? null,
      userId: user.id,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      email: identity.email,
      emailVerified: identity.emailVerified ?? null,
      username: identity.username || null,
      displayName: identity.displayName || null,
      avatarUrl: identity.avatarUrl || null,
    });

    return {
      intent: 'link',
      success: true,
    };
  }
}
