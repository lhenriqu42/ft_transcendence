import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { InfraModule } from '../infra/infra.module';
import { RiskEngineService } from './domain/risk-engine.service';
import { IpInfoService } from './application/providers/ip-info.service';
import { SessionService } from './application/providers/session.service';
import { OAuthProviderFactory } from './application/ports/utils/OAuthProviderFactory';
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshUseCase,
  RegisterUseCase,
  ChallengeUseCase,
  OAuthStartUseCase,
  ResetPasswordUseCase,
  OAuthCallbackUseCase,
  ChangePasswordUseCase,
  ForgotPasswordUseCase,
} from './application';

@Module({
  imports: [InfraModule],
  providers: [
    OAuthStartUseCase,
    OAuthCallbackUseCase,
    OAuthProviderFactory,
    LoginUseCase,
    LogoutUseCase,
    RefreshUseCase,
    RegisterUseCase,
    ChallengeUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    IpInfoService,
    SessionService,
    RiskEngineService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
