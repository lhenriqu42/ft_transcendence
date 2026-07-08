import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { InfraModule } from '../infra/infra.module';
import { RiskEngineService } from './domain/risk-engine.service';
import { IpInfoService } from './application/providers/ip-info.service';
import { SessionService } from './application/providers/session.service';
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshUseCase,
  RegisterUseCase,
  ChallengeUseCase,
} from './application';

@Module({
  imports: [InfraModule],
  providers: [
    LoginUseCase,
    LogoutUseCase,
    RefreshUseCase,
    RegisterUseCase,
    ChallengeUseCase,
    IpInfoService,
    SessionService,
    RiskEngineService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
