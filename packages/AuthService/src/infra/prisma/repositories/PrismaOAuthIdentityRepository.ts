import { OAuthProviderType } from '../../../auth/application/contracts/auth.contracts';
import {
  Atomic,
  OAuthIdentityRepository,
} from '../../../auth/application/ports';
import { PrismaService } from '../prisma.service';
import { Injectable } from '@nestjs/common';
import { OAuthIdentity } from '../../../auth/domain/entities/oauth-identity.entity';

@Injectable()
export class PrismaOAuthIdentityRepository implements OAuthIdentityRepository {
  constructor(private readonly prismaService: PrismaService) {}

  find(
    provider: OAuthProviderType,
    providerUserId: string,
  ): Atomic<OAuthIdentity | null> {
    return this.prismaService.oAuthIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
    });
  }

  create(identity: OAuthIdentity): Atomic<OAuthIdentity> {
    return this.prismaService.oAuthIdentity.create({
      data: {
        id: identity.id,
        userId: identity.userId,
        provider: identity.provider,
        providerUserId: identity.providerUserId,
        email: identity.email,
        emailVerified: identity.emailVerified,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        providerAccessToken: identity.providerAccessToken,
        providerRefreshToken: identity.providerRefreshToken,
        createdAt: identity.createdAt,
        updatedAt: identity.updatedAt,
      },
    });
  }

  update(id: string, identity: Partial<OAuthIdentity>): Atomic<OAuthIdentity> {
    return this.prismaService.oAuthIdentity.update({
      where: { id },
      data: {
        email: identity.email,
        emailVerified: identity.emailVerified,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        providerAccessToken: identity.providerAccessToken,
        providerRefreshToken: identity.providerRefreshToken,
        updatedAt: new Date(),
      },
    });
  }
}
