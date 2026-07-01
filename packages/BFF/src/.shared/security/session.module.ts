import { Module } from '@nestjs/common';
import { SessionValidatorService } from './SessionValidator.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [SessionValidatorService],
  exports: [SessionValidatorService],
})
export class SessionModule {}
