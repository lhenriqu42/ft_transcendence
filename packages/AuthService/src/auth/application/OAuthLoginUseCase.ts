import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  OAuthIdentityRepository,
  OAuthIdentityResume,
  PendingLinkStore,
  UserRepository,
  OAuthTokens,
  DeviceRepository,
  LoginIpContext,
  UnitOfWork,
} from './ports';
import * as CI from './contracts/auth.contracts';
import { OAuthService } from './providers/oauth.service';
import { LoginCompletionService } from './providers/login-completion.service';
import { LoginMethod } from '../../infra/prisma/generated/enums';
import { ACCESS_TOKEN_TTL_SECONDS } from './LoginUseCase';

interface Params {
  ipContext: LoginIpContext;
  identity: OAuthIdentityResume;
  tokens: OAuthTokens;
  prevDID: string | null;
  currDID: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
}

@Injectable()
export class OAuthLoginUseCase {
  constructor(
    private readonly uof: UnitOfWork,
    private readonly userRepo: UserRepository,
    private readonly oAuthService: OAuthService,
    private readonly deviceRepo: DeviceRepository,
    private readonly pendingLinkStore: PendingLinkStore,
    private readonly loginCompletion: LoginCompletionService,
    private readonly oAuthIdentityRepo: OAuthIdentityRepository,
  ) {}

  async execute(params: Params): Promise<CI.OAuthLoginPathResponse> {
    const {
      tokens,
      prevDID,
      currDID,
      identity,
      userAgent,
      ipContext,
      deviceFingerprint,
    } = params;

    if (prevDID !== currDID) {
      throw new UnauthorizedException(
        'Device ID mismatch between state and callback request',
      );
    }

    const existingOAuth = await this.oAuthService.findOAuthIdentity(
      identity.provider,
      identity.providerUserId,
    );

    let userId: string;
    let oauthIdentityId: string;

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
      if (!user)
        throw new InternalServerErrorException(
          `User not found (userId: ${existingOAuth.userId})`,
        );
      userId = user.id;
      oauthIdentityId = existingOAuth.id;
    } else {
      const existingUser = await this.userRepo.findByEmail(identity.email);
      if (existingUser) {
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
        );
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'An account with this email already exists',
          pendingToken,
          email: existingUser.email,
          provider: identity.provider,
        });
      }

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

      const newIdentity = await this.oAuthIdentityRepo.create({
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

      userId = user.id;
      oauthIdentityId = newIdentity.id;
    }

    const device = await this.deviceRepo.findOrCreate({
      userId,
      deviceId: currDID,
      userAgent,
      fingerprint: deviceFingerprint,
    });

    const loginProcess = this.loginCompletion.prepare({
      userId,
      oauthIdentityId,
      ipContext,
      userAgent,
      oauthProvider: identity.provider,
      deviceId: device.id,
      method: LoginMethod.OAUTH,

      captchaRequired: false,
      mfaRequired: false,
      riskScore: 0,
    });

    const [accessToken] = await Promise.all([
      ...loginProcess.promises,
      this.uof.runBatch(loginProcess.prismaPromises),
    ]);

    return {
      intent: 'login',
      accessToken,
      refreshToken: loginProcess.refreshToken,
      sessionId: loginProcess.payload.sid,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      userId,
      deviceId: device.id,
    };
  }
}
