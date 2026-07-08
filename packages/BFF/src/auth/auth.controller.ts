import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import * as CI from './contracts/auth.contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  RegisterDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from './auth.dto';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true, // TODO: false em dev local sem HTTPS, via config
  sameSite: 'lax' as const,
  path: '/',
};

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // espelha o AuthService

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDTO,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const deviceId = req.cookies?.did;

    let challengeId = body.challengeId;
    let requiresCaptcha = false;
    let requiresMFA = false;

    // 1ª chamada do client: ainda não tem challengeId, faz a avaliação de risco
    if (!challengeId) {
      const challengeResponse = await this.authService.challenge({
        email: body.email,
        deviceFingerprint: body.fingerprint,
        ip,
        userAgent,
        deviceId,
      });

      challengeId = challengeResponse.challengeId;
      requiresCaptcha = challengeResponse.requiresCaptcha;
      requiresMFA = challengeResponse.requiresMFA;

      // Se precisa de captcha/MFA e o client ainda não mandou, devolve o
      // desafio pra tela pedir e o client chama /login de novo com
      // challengeId + captchaToken/mfaCode preenchidos.

      if (requiresCaptcha || requiresMFA) {
        return challengeResponse;
      }
    }

    const loginResponse = await this.authService.login({
      challengeId,
      email: body.email,
      password: body.password,
      captchaToken: body.captchaToken,
      mfaCode: body.mfaCode,
    });

    // refreshToken e sessionId ficam só no cookie httpOnly — nunca voltam
    // no body pro JS do client conseguir ler.
    reply.setCookie('r', loginResponse.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    reply.setCookie('sid', loginResponse.sessionId, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    reply.setCookie('uid', loginResponse.userId, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    reply.setCookie('did', loginResponse.deviceId, {
      ...COOKIE_OPTS,
      maxAge: 365 * 24 * 60 * 60, // 1 ano
    });

    return {
      accessToken: loginResponse.accessToken,
      expiresIn: loginResponse.expiresIn,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = req.cookies?.r;
    const sessionId = req.cookies?.sid;
    console.log(req.cookies);
    if (!refreshToken || !sessionId) {
      throw new UnauthorizedException('Missing session');
    }

    const refreshResponse = await this.authService.refresh({
      refreshToken,
      sessionId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? '',
    });

    reply.setCookie('r', refreshResponse.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });

    return {
      accessToken: refreshResponse.accessToken,
      expiresIn: refreshResponse.expiresIn,
    };
  }

  @Post('logout')
  async logout(
    @Body() body: { allDevices?: boolean } = {},
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const sessionId = req.cookies?.sid;
    const userId = req.cookies?.uid;

    if (sessionId && userId) {
      const logoutRequest: CI.LogoutRequest = {
        sessionId,
        userId,
        allDevices: body.allDevices,
      };
      await this.authService.logout(logoutRequest);
    }

    reply.clearCookie('refreshToken', COOKIE_OPTS);
    reply.clearCookie('sessionId', COOKIE_OPTS);
    reply.clearCookie('userId', COOKIE_OPTS);

    return { success: true };
  }

  @Post('register')
  async register(@Body() body: RegisterDTO) {
    return await this.authService.register({
      name: body.name,
      email: body.email,
      password: body.password,
    });
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    return await this.authService.forgotPassword({
      email: body.email,
    });
  }

  @Post('forgot-password/reset-password')
  async resetPassword(@Body() body: ResetPasswordDTO) {
    return await this.authService.resetPassword({
      token: body.token,
      newPassword: body.newPassword,
    });
  }
}
