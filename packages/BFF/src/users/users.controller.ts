import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/security/auth.guard';
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {}
