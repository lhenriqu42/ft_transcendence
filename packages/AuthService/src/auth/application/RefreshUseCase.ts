import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './providers/session.service';
import * as CI from './contracts/auth.contracts';
import {
  InvalidRefreshTokenError,
  RefreshTokenExpiredError,
  RefreshTokenReuseError,
  SessionMismatchError,
} from '../domain/errors/session.errors';

@Injectable()
export class RefreshService {
  constructor(private readonly sessionService: SessionService) {}

  async execute(body: CI.RefreshRequest): Promise<CI.RefreshResponse> {
    // TODO: usar body.ip / body.userAgent para detectar mudança suspeita de
    // dispositivo/localização e, se necessário, forçar reautenticação (MFA)
    // mesmo com um refresh token válido.
    try {
      const { accessToken, refreshToken, expiresIn } =
        await this.sessionService.refresh(body.sessionId, body.refreshToken);

      return { accessToken, refreshToken, expiresIn };
    } catch (err) {
      if (
        err instanceof InvalidRefreshTokenError ||
        err instanceof RefreshTokenExpiredError ||
        err instanceof SessionMismatchError ||
        err instanceof RefreshTokenReuseError
      ) {
        throw new UnauthorizedException(err.message);
      }
      throw err;
    }
  }
}
