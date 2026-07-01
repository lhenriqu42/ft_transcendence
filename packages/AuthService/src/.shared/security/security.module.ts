import { Module } from '@nestjs/common';

import { SecretAuthGuard } from './auth.guard';
import { ConfigModule } from '@nestjs/config/dist/config.module';

@Module({
  imports: [ConfigModule],
  providers: [SecretAuthGuard],
  exports: [SecretAuthGuard],
})
export class SecurityModule {}
