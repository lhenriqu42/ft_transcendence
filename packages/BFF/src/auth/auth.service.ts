import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CI from './contracts/auth.contracts';
import { CircuitBreaker } from '../.shared/CircuitBreaker/CircuitBreaker';

@Injectable()
export class AuthService {
  private breaker: CircuitBreaker;
  private authServiceUrl: string;
  private signatureKey: string;

  constructor(private readonly configService: ConfigService) {
    this.breaker = new CircuitBreaker({
      maxAttempts: 3,
      halfOpenAfter: 5000,
      consecutiveBreaker: 2,
      timeout: 2000,
    });
    this.authServiceUrl = this.configService.getOrThrow('AUTH_SERVICE_URL');
    this.signatureKey = this.configService.getOrThrow('BFF_SIGNATURE_KEY');
  }

  async challenge(payload: CI.ChallengeRequest): Promise<CI.ChallengeResponse> {
    console.log('challenge: ', payload);
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/login/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );
    return this.parseResponse(response);
  }

  async login(payload: CI.LoginRequest): Promise<CI.LoginResponse> {
    console.log('login: ', payload);
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );
    return this.parseResponse(response);
  }

  async refresh(payload: CI.RefreshRequest): Promise<CI.RefreshResponse> {
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );
    return this.parseResponse(response);
  }

  async logout(payload: CI.LogoutRequest): Promise<void> {
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );
    return this.parseResponse(response, { expectBody: false });
  }

  async register(payload: CI.RegisterRequest): Promise<CI.RegisterResponse> {
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );

    return this.parseResponse(response);
  }

  async forgotPassword(payload: CI.ForgotPasswordRequest): Promise<void> {
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );

    return this.parseResponse(response, { expectBody: false });
  }

  async resetPassword(payload: CI.ResetPasswordRequest): Promise<void> {
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );

    return this.parseResponse(response, { expectBody: false });
  }

  async startOAuth(payload: CI.OAuthStartRequest): Promise<{ url: string }> {
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );

    return this.parseResponse(response);
  }

  async handleOAuthCallback(
    payload: CI.OAuthCallbackRequest,
  ): Promise<CI.OAuthCallbackResponse> {
    const response = await this.breaker.execute(() =>
      fetch(`${this.authServiceUrl}/auth/oauth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.signatureKey,
        },
        body: JSON.stringify(payload),
      }),
    );

    return this.parseResponse(response);
  }

  // ---------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------

  private async parseResponse<T>(
    response: Response,
    opts: { expectBody?: boolean } = { expectBody: true },
  ): Promise<T> {
    console.log(response);
    if (response.ok) {
      if (opts.expectBody === false) return undefined as T;
      return response.json() as Promise<T>;
    }

    // Repassa o status do AuthService pro client (401/403/etc), em vez de
    // sempre estourar 500 — o BFF é só uma ponte aqui.
    let message = 'Auth service error';
    try {
      const errorBody = (await response.json()) as { message?: string };
      message = errorBody.message ?? message;
    } catch {
      // corpo de erro não veio em JSON, mantém mensagem genérica
    }

    throw new HttpException(message, response.status);
  }
}
