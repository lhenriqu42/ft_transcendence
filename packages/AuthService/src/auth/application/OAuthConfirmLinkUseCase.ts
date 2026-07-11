import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  OAuthIdentityRepository,
  PendingLinkStore,
  UserRepository,
} from './ports';
import * as CI from './contracts/auth.contracts';
import * as argon2 from 'argon2';

@Injectable()
export class OAuthConfirmLinkUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly oAuthIdentityRepo: OAuthIdentityRepository,
    private readonly pendingLinkStore: PendingLinkStore,
  ) {}

  async execute({
    pendingToken,
    password,
  }: CI.OAuthConfirmLinkRequest): Promise<CI.OAuthCallbackResponse> {
    const pending = await this.pendingLinkStore.get(pendingToken);
    if (!pending) {
      throw new UnauthorizedException('link confirmation expired or invalid');
    }

    await this.pendingLinkStore.delete(pendingToken); // uso único

    const user = await this.userRepo.findById(pending.candidateUserId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, password);

    if (!valid) {
      throw new UnauthorizedException('invalid credentials');
    }

    const now = new Date();
    await this.oAuthIdentityRepo.create({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      providerAccessToken: pending.tokens.accessToken,
      providerRefreshToken: pending.tokens.refreshToken ?? null,
      userId: user.id,
      provider: pending.identity.provider,
      providerUserId: pending.identity.providerUserId,
      email: pending.identity.email,
      emailVerified: pending.identity.emailVerified ?? null,
      username: pending.identity.username || null,
      displayName: pending.identity.displayName || null,
      avatarUrl: pending.identity.avatarUrl || null,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      accountLocked: user.accountLocked,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}
