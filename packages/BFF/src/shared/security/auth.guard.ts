import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SessionValidatorService } from './SessionValidator.service';
import { JwtVerifier } from '../security/jwt-verifier.service';
import { FastifyRequest } from 'fastify';

function extractBearer(req: FastifyRequest) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return null;
  }
  const [scheme, token, extra] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token || extra) {
    return null;
  }
  return token;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtVerifier: JwtVerifier,
    private readonly sessionValidator: SessionValidatorService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<FastifyRequest>();

    const token = extractBearer(req);
    if (!token) return false;
    const payload = await this.jwtVerifier.verify(token);
    const session = await this.sessionValidator.validate(payload.sessionId);

    if (!session) return false;

    req.user = {
      ...payload,
      session,
    };

    return true;
  }
}
