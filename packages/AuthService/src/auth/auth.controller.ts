import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SecretAuthGuard } from '../.shared/security/auth.guard';
import * as CI from './application/contracts/auth.contracts';
import { UseGuards } from '@nestjs/common';

import {
  LoginUseCase,
  LogoutUseCase,
  RefreshUseCase,
  RegisterUseCase,
  ChallengeUseCase,
  OAuthStartUseCase,
  OAuthCallbackUseCase,
  ResetPasswordUseCase,
  ForgotPasswordUseCase,
  ChangePasswordUseCase,
  OAuthConfirmLinkUseCase,
} from './application';

@Controller('auth')
@UseGuards(SecretAuthGuard)
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly challengeUseCase: ChallengeUseCase,
    private readonly oAuthStartUseCase: OAuthStartUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly oAuthCallbackUseCase: OAuthCallbackUseCase,
    private readonly oAuthConfirmLinkUseCase: OAuthConfirmLinkUseCase,
  ) {}

  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  challenge(@Body() body: CI.ChallengeRequest): Promise<CI.ChallengeResponse> {
    body.email = body.email.toLowerCase();
    return this.challengeUseCase.execute(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: CI.LoginRequest): Promise<CI.LoginResponse> {
    body.email = body.email.toLowerCase();
    body.password = body.password.trim();
    return this.loginUseCase.execute(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: CI.RefreshRequest): Promise<CI.RefreshResponse> {
    return this.refreshUseCase.execute(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() body: CI.LogoutRequest): Promise<void> {
    return this.logoutUseCase.execute(body);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: CI.RegisterRequest): Promise<CI.RegisterResponse> {
    body.email = body.email.toLowerCase();
    body.password = body.password.trim();
    body.name = formatName(body.name);
    return this.registerUseCase.execute(body);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Body() body: CI.ChangePasswordRequest): Promise<void> {
    body.newPassword = body.newPassword.trim();
    return this.changePasswordUseCase.execute(body.userId, body.newPassword);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(
    @Body() body: CI.ForgotPasswordRequest,
  ): Promise<CI.ForgotPasswordResponse> {
    body.email = body.email.toLowerCase();
    return this.forgotPasswordUseCase.execute(body);
  }

  @Post('forgot-password/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(
    @Body() body: CI.ResetPasswordRequest,
  ): Promise<CI.ResetPasswordResponse> {
    body.newPassword = body.newPassword.trim();
    return this.resetPasswordUseCase.execute(body);
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  oAuthStart(
    @Body() body: CI.OAuthStartRequest,
  ): Promise<CI.OAuthStartResponse> {
    return this.oAuthStartUseCase.execute(body);
  }

  @Post('oauth/callback')
  @HttpCode(HttpStatus.OK)
  oAuthCallback(
    @Body() body: CI.OAuthCallbackRequest,
  ): Promise<CI.OAuthCallbackResponse> {
    return this.oAuthCallbackUseCase.execute(body);
  }

  @Post('oauth/confirm-link')
  @HttpCode(HttpStatus.OK)
  oAuthConfirmLink(
    @Body() body: CI.OAuthConfirmLinkRequest,
  ): Promise<CI.OAuthCallbackResponse> {
    return this.oAuthConfirmLinkUseCase.execute(body);
  }
}

function formatName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100)
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}
