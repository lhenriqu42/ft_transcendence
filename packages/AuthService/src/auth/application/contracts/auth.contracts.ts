import { JWTPayload } from 'jose';

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  sid: string;
}

export const OAuthProvider = {
  GOOGLE: 'GOOGLE',
  GITHUB: 'GITHUB',
  DISCORD: 'DISCORD',
  ECOLE42: 'ECOLE42',
} as const;

type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider];
export type OAuthProviderType = OAuthProvider;

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
  allDevices?: boolean;
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

type LinkPath = {
  intent: 'link';
  userId: string;
  ip: string;

  deviceId: null;
  userAgent: null;
  deviceFingerprint: null;
};

type LoginPath = {
  intent: 'login';
  userId: null;

  ip: string;
  deviceId: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
};

export type IntentPath = LinkPath | LoginPath;

export interface OAuthStartRequest {
  info: IntentPath;
  provider: OAuthProviderType;
}

export interface OAuthStartResponse {
  authorizationUrl: URL;
}

export interface OAuthCallbackRequest {
  ip: string;
  sub: string | null;
  deviceId: string | null;
  code: string;
  state: string;
}

export interface OAuthIdentity {
  provider: OAuthProviderType;

  providerUserId: string;

  email: string;

  emailVerified: boolean;

  username?: string;

  displayName?: string;

  avatarUrl?: string;
}

export interface OAuthLoginPathResponse {
  intent: 'login';
  userId: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  deviceId: string;
  expiresIn: number;
}

export interface OAuthLinkPathResponse {
  intent: 'link';
  success: boolean;
}

export type OAuthCallbackResponse =
  | OAuthLoginPathResponse
  | OAuthLinkPathResponse;

export interface OAuthConfirmLinkRequest {
  pendingToken: string;
  password: string;
}
