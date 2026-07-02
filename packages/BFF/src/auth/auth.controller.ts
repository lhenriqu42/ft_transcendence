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
import { RegisterDTO } from './auth.dto';

interface LoginBody {
  email: string;
  password: string;
  fingerprint?: string;
  challengeId?: string; // presente na 2ª chamada, quando captcha/MFA já foram resolvidos
  captchaToken?: string;
  mfaCode?: string;
}

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
    @Body() body: LoginBody,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] ?? '';

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
      });

      challengeId = challengeResponse.challengeId;
      requiresCaptcha = challengeResponse.requiresCaptcha;
      requiresMFA = challengeResponse.requiresMFA;

      // Se precisa de captcha/MFA e o client ainda não mandou, devolve o
      // desafio pra tela pedir e o client chama /login de novo com
      // challengeId + captchaToken/mfaCode preenchidos.
      const missingCaptcha = requiresCaptcha && !body.captchaToken;
      const missingMfa = requiresMFA && !body.mfaCode;

      if (missingCaptcha || missingMfa) {
        return challengeResponse;
      }
    }

    const loginResponse = await this.authService.login({
      challengeId,
      email: body.email,
      password: body.password,
      userAgent,
      ip,
      captchaToken: body.captchaToken,
      mfaCode: body.mfaCode,
    });

    // refreshToken e sessionId ficam só no cookie httpOnly — nunca voltam
    // no body pro JS do client conseguir ler.
    reply.setCookie('RToken', loginResponse.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    reply.setCookie('sessionId', loginResponse.sessionId, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    reply.setCookie('userId', loginResponse.user.id, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });

    return {
      accessToken: loginResponse.accessToken,
      expiresIn: loginResponse.expiresIn,
      user: loginResponse.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const sessionId = req.cookies?.sessionId;

    if (!refreshToken || !sessionId) {
      throw new UnauthorizedException('Missing session');
    }

    const refreshResponse = await this.authService.refresh({
      refreshToken,
      sessionId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? '',
    });

    reply.setCookie('RToken', refreshResponse.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });

    return refreshResponse; // { accessToken, expiresIn }
  }

  @Post('logout')
  async logout(
    @Body() body: { allDevices?: boolean } = {},
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const sessionId = req.cookies?.sessionId;
    const userId = req.cookies?.userId;

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
    const registerResponse = await this.authService.register({
      email: body.email,
      password: body.password,
    });
    return registerResponse;
  }
}
