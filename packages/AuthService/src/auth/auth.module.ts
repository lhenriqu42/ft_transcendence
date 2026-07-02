import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../.shared/prisma/prisma.module';
import { RedisModule } from '../.shared/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
