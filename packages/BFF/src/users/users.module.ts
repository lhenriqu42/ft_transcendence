import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SecurityModule } from '../.shared/security/security.module';

@Module({
  imports: [SecurityModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
