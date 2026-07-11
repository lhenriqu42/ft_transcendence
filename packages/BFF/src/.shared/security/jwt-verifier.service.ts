import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';

export interface AccessTokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  iat: number; // issued at
  exp: number; // expiration time
  roles: string[];
}

@Injectable()
export class JwtVerifier {
  private readonly secret: Uint8Array;

  constructor(private readonly config: ConfigService) {
    this.secret = new TextEncoder().encode(
      this.config.getOrThrow<string>('JWT_SECRET'),
    );
  }

  async verify(token: string): Promise<AccessTokenPayload> {
    try {
      const { payload } = await jwtVerify<AccessTokenPayload>(
        token,
        this.secret,
        {
          algorithms: ['HS256'],
          issuer: 'auth-service',
          audience: 'bff',
        },
      );
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
