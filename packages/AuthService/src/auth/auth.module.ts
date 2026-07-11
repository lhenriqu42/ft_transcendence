import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { InfraModule } from '../infra/infra.module';
import { RiskEngineService } from './domain/risk-engine.service';
import { OAuthService } from './application/providers/oauth.service';
import { IpInfoService } from './application/providers/ip-info.service';
import { SessionService } from './application/providers/session.service';
import { OAuthProviderFactory } from './application/ports/utils/OAuthProviderFactory';
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshUseCase,
  RegisterUseCase,
  OAuthLinkUseCase,
  OAuthLoginUseCase,
  ChallengeUseCase,
  OAuthStartUseCase,
  ResetPasswordUseCase,
  OAuthCallbackUseCase,
  ChangePasswordUseCase,
  ForgotPasswordUseCase,
  OAuthConfirmLinkUseCase,
} from './application';

@Module({
  imports: [InfraModule],
  providers: [
    OAuthProviderFactory,

    LoginUseCase,
    LogoutUseCase,
    RefreshUseCase,
    RegisterUseCase,
    ChallengeUseCase,
    OAuthStartUseCase,
    OAuthCallbackUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,

    OAuthStartUseCase,
    OAuthCallbackUseCase,
    OAuthConfirmLinkUseCase,

    OAuthLinkUseCase,
    OAuthLoginUseCase,

    IpInfoService,
    SessionService,
    RiskEngineService,
    OAuthService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
