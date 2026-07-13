import {
  Get,
  Req,
  Res,
  Body,
  Post,
  Query,
  UseGuards,
  Controller,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import * as CI from './contracts/auth.contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { extractBearer, JwtAuthGuard } from '../.shared/security/auth.guard';
import {
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
  OAuthInitiateDTO,
  ForgotPasswordDTO,
  OAuthCallbackQueryDTO,
  OAuthConfirmLinkDTO,
} from './auth.dto';
import { JwtVerifier } from '../.shared/security/jwt-verifier.service';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true, // TODO: false em dev local sem HTTPS, via config
  sameSite: 'lax' as const,
  path: '/',
};

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // espelha o AuthService

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtVerifier: JwtVerifier,
  ) {}

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

  // OAuth routes

  @Post('oauth/login')
  async oauthLogin(@Body() body: OAuthInitiateDTO, @Req() req: FastifyRequest) {
    const deviceId = req.cookies?.did;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    return await this.authService.startOAuth({
      info: {
        intent: 'login',
        userId: null,

        ip,
        deviceId: deviceId ?? null,
        userAgent: userAgent ?? null,
        deviceFingerprint: body.fingerprint ?? null,
      },
      provider: body.provider,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('oauth/link')
  async oauthLink(
    @Body()
    body: OAuthInitiateDTO,

    @Req()
    req: FastifyRequest,
  ) {
    const userId = req.user?.jwtPayload.sub;
    const ip = req.ip;

    if (!userId) {
      throw new UnauthorizedException(
        'User ID is required for linking accounts',
      );
    }

    return await this.authService.startOAuth({
      info: {
        intent: 'link',
        userId,
        ip,

        deviceId: null,
        userAgent: null,
        deviceFingerprint: null,
      },
      provider: body.provider,
    });
  }

  @Get('oauth/callback')
  async oauthCallback(
    @Query()
    query: OAuthCallbackQueryDTO,

    @Req()
    req: FastifyRequest,

    @Res({ passthrough: true })
    reply: FastifyReply,
  ) {
    const token = extractBearer(req);
    const deviceId = req.cookies?.did;
    const ip = req.ip;

    const response = await this.authService.handleOAuthCallback({
      ...query,
      ip,
      sub: token ? (await this.jwtVerifier.verify(token)).sub : null,
      deviceId: deviceId ?? null,
    });

    if (response.intent === 'link') {
      return { success: response.success };
    }

    reply.setCookie('r', response.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    reply.setCookie('sid', response.sessionId, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    reply.setCookie('uid', response.userId, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    reply.setCookie('did', response.deviceId, {
      ...COOKIE_OPTS,
      maxAge: 365 * 24 * 60 * 60, // 1 ano
    });

    return {
      accessToken: response.accessToken,
      expiresIn: response.expiresIn,
    };
  }

  @Post('oauth/confirm-link')
  async oauthConfirmLink(
    @Body()
    body: OAuthConfirmLinkDTO,
  ) {
    return this.authService.confirmOAuthLink(body);
  }
}
