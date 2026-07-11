import 'fastify';
import type { AccessTokenPayload } from '../.shared/security/jwt-verifier.service';
import type { ActiveSession } from '../.shared/security/SessionValidator.service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      jwtPayload: AccessTokenPayload;
      session: ActiveSession;
    };
  }
}
