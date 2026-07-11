import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../.shared/security/auth.guard';
import type { FastifyRequest } from 'fastify/types/request';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Post('profile')
  getProfile(@Req() req: FastifyRequest) {
    return req.user;
  }
}
