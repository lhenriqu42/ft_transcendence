import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';

interface UserPayload {
  sessionId: string;
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtVerifier {
  private readonly secret: Uint8Array;

  constructor(private readonly config: ConfigService) {
    this.secret = new TextEncoder().encode(
      this.config.getOrThrow<string>('JWT_SECRET'),
    );
  }

  async verify(token: string): Promise<UserPayload> {
    const { payload } = await jwtVerify<UserPayload>(token, this.secret, {
      algorithms: ['HS256'],
      issuer: 'auth-service',
      audience: 'bff',
    });

    return payload;
  }
}
