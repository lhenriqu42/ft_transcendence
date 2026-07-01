// ─── auth/auth.service.interface.ts ───────────────────────────────────────────

import {
  ChallengeRequest,
  ChallengeResponse,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
} from '../contracts/auth.contracts';

export interface IAuthService {
  /**
   * Avalia risco da tentativa de login antes de expor o campo de senha.
   * Persiste o desafio no Redis com TTL curto (~2 min).
   */
  createChallenge(req: ChallengeRequest): Promise<ChallengeResponse>;

  /**
   * Valida desafio, credenciais, captcha e MFA (quando exigido).
   * Cria sessão + refresh token, persiste no Redis e no DB.
   */
  login(req: LoginRequest): Promise<LoginResponse>;

  /**
   * Valida o refresh token, verifica se a sessão ainda está ativa,
   * rotaciona o refresh token (rotation strategy) e devolve novo access token.
   */
  refresh(req: RefreshRequest): Promise<RefreshResponse>;

  /**
   * allDevices=false → invalida só a sessão informada
   * allDevices=true  → invalida todas as sessões do usuário (Redis + DB)
   */
  logout(req: LogoutRequest): Promise<void>;
}

export const AUTH_SERVICE = Symbol('IAuthService');
