import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { FastifyRequest } from 'fastify';

@Injectable()
export class SecretAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<FastifyRequest>();

    const secret = req.headers['x-internal-secret'];

    if (!secret) return false;
    if (secret !== this.config.get('BFF_SIGNATURE_KEY')) return false;

    return true;
  }
}
