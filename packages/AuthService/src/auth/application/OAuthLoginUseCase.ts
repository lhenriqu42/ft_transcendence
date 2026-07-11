import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  OAuthIdentityRepository,
  OAuthIdentityResume,
  PendingLinkStore,
  UserRepository,
  OAuthTokens,
} from './ports';
import { OAuthService } from './providers/oauth.service';
import * as CI from './contracts/auth.contracts';

interface Params {
  identity: OAuthIdentityResume;
  tokens: OAuthTokens;
}

@Injectable()
export class OAuthLoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly oAuthService: OAuthService,
    private readonly oAuthIdentityRepo: OAuthIdentityRepository,
    private readonly pendingLinkStore: PendingLinkStore,
  ) {}

  async execute({
    identity,
    tokens,
  }: Params): Promise<CI.OAuthCallbackResponse> {
    const existingOAuth = await this.oAuthService.findOAuthIdentity(
      identity.provider,
      identity.providerUserId,
    );

    // 1. já existe identidade ligada a um usuário -> login normal
    if (existingOAuth) {
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
          `User not found for login (userId: ${existingOAuth.userId})`,
        );
      }

      return user;
    }

    // 2. identidade nova -> checa se já existe usuário com esse email
    const existingUser = await this.userRepo.findByEmail(identity.email);

    if (existingUser) {
      // NÃO linka automaticamente. Guarda a identity+tokens temporariamente
      // e devolve um "pedido de confirmação" pro front perguntar a senha.
      const pendingToken = crypto.randomUUID();

      await this.pendingLinkStore.set(
        pendingToken,
        {
          identity,
          tokens,
          candidateUserId: existingUser.id,
          candidateEmail: existingUser.email,
        },
        { ttlSeconds: 300 },
      ); // 5 min pra confirmar

      throw new ConflictException({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account with this email already exists',
        pendingToken,
        email: existingUser.email,
        provider: identity.provider,
      });
    }

    // 3. não existe nem identidade nem usuário -> provisiona usuário novo
    const now = new Date();
    const user = await this.userRepo.save({
      id: crypto.randomUUID(),
      name: identity.displayName || identity.username || null,
      email: identity.email,
      passwordHash: null,
      emailVerified: identity.emailVerified ?? null,
      failedLoginCount: 0,
      accountLocked: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

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

    return user;
  }
}
