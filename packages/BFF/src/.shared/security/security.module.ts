import { Module } from '@nestjs/common';

import { JwtVerifier } from './jwt-verifier.service';
import { JwtAuthGuard } from './auth.guard';
import { SessionModule } from './session.module';

@Module({
  imports: [SessionModule],
  providers: [JwtVerifier, JwtAuthGuard],
  exports: [JwtVerifier, JwtAuthGuard, SessionModule],
})
export class SecurityModule {}
