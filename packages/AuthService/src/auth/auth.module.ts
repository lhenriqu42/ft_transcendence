import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { InfraModule } from '../infra/infra.module';
import { ChallengeService, LoginService } from './application';
import { RiskEngineService } from './domain/risk-engine.service';
import { IpInfoService } from './application/providers/ip-info.service';
import { SessionService } from './application/providers/session.service';

@Module({
  imports: [InfraModule],
  providers: [
    LoginService,
    IpInfoService,
    SessionService,
    ChallengeService,
    RiskEngineService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
