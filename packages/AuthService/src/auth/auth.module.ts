import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { InfraModule } from '../infra/infra.module';
import { RiskEngineService } from './domain/risk-engine.service';
import { IpInfoService } from './application/providers/ip-info.service';
import { SessionService } from './application/providers/session.service';
import {
  LoginService,
  LogoutService,
  RefreshService,
  RegisterService,
  ChallengeService,
} from './application';

@Module({
  imports: [InfraModule],
  providers: [
    LoginService,
    LogoutService,
    IpInfoService,
    RefreshService,
    SessionService,
    RegisterService,
    ChallengeService,
    RiskEngineService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
