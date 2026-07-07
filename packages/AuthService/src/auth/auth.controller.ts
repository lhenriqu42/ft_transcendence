import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { SecretAuthGuard } from '../.shared/security/auth.guard';
import * as CI from './application/contracts/auth.contracts';
import {
  LoginService,
  LogoutService,
  RefreshService,
  RegisterService,
  ChallengeService,
} from './application';

@Controller('auth')
@UseGuards(SecretAuthGuard)
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly registerService: RegisterService,
    private readonly logoutService: LogoutService,
    private readonly refreshService: RefreshService,
    private readonly challengeService: ChallengeService,
  ) {}

  /**
   * Passo 1 do login — BFF chama antes de mostrar o campo de senha.
   * Retorna se precisa de captcha/MFA e um challengeId com TTL curto.
   */
  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  challenge(@Body() body: CI.ChallengeRequest): Promise<CI.ChallengeResponse> {
    body.email = body.email.toLowerCase();
    return this.challengeService.execute(body);
  }

  /**
   * Passo 2 — BFF envia credenciais + challengeId previamente gerado.
   * IP e userAgent vêm no body pois o BFF é quem tem acesso ao cliente real.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: CI.LoginRequest): Promise<CI.LoginResponse> {
    body.email = body.email.toLowerCase();
    body.password = body.password.trim();
    return this.loginService.execute(body);
  }

  /**
   * BFF chama quando o access token expirou mas a sessão ainda é válida.
   * Usa rotation strategy: cada refresh token só pode ser usado uma vez.
   * Se um refresh token já usado aparecer → sinal de roubo → revoga tudo.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: CI.RefreshRequest): Promise<CI.RefreshResponse> {
    return this.refreshService.execute(body);
  }

  /**
   * allDevices omitido ou false → logout da sessão atual
   * allDevices: true           → logout de todos os dispositivos
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() body: CI.LogoutRequest): Promise<void> {
    return this.logoutService.execute(body);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: CI.RegisterRequest): Promise<CI.RegisterResponse> {
    body.email = body.email.toLowerCase();
    body.password = body.password.trim();
    body.name = formatName(body.name);
    return this.registerService.execute(body);
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
