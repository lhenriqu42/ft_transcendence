export interface ChallengeRequest {
  email: string;
  ip: string;

  deviceId?: string;
  userAgent?: string;
  deviceFingerprint?: string;
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
  captchaToken?: string;
  mfaCode?: string;
}

export interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  deviceId: string;
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
  sessionId: string;
  ip: string; // BFF repassa para detectar mudança de IP suspeita
  userAgent: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  sessionId: string;
  userId: string;
  allDevices?: boolean; // false → encerra só a sessão atual
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
}

export interface ChangePasswordRequest {
  userId: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
