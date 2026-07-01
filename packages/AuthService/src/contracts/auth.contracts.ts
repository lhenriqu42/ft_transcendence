export interface ChallengeRequest {
  email: string;
  userAgent: string;
  ip: string;
}

export interface ChallengeResponse {
  challengeId: string;
  requiresCaptcha: boolean;
  requiresMFA: boolean;
  expiresAt: number;
}

export interface LoginRequest {
  challengeId: string;
  email: string;
  password: string;
  userAgent: string; // adicionado: BFF repassa
  ip: string; // adicionado: BFF repassa
  captchaToken?: string;
  mfaCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

export interface RefreshRequest {
  refreshToken: string;
  sessionId: string;
  ip: string; // BFF repassa para detectar mudança de IP suspeita
  userAgent: string;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  sessionId: string;
  userId: string;
  allDevices?: boolean; // false → encerra só a sessão atual
}
