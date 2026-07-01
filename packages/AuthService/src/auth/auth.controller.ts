import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { SecretAuthGuard } from '../.shared/security/auth.guard';
import * as authServiceInterface from './auth.service.interface';
import * as authContracts from '../contracts/auth.contracts';

@Controller('auth')
@UseGuards(SecretAuthGuard)
export class AuthController {
  constructor(
    @Inject(authServiceInterface.AUTH_SERVICE)
    private readonly authService: authServiceInterface.IAuthService,
  ) {}

  /**
   * Passo 1 do login — BFF chama antes de mostrar o campo de senha.
   * Retorna se precisa de captcha/MFA e um challengeId com TTL curto.
   */
  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  challenge(
    @Body() body: authContracts.ChallengeRequest,
  ): Promise<authContracts.ChallengeResponse> {
    return this.authService.createChallenge(body);
  }

  /**
   * Passo 2 — BFF envia credenciais + challengeId previamente gerado.
   * IP e userAgent vêm no body pois o BFF é quem tem acesso ao cliente real.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() body: authContracts.LoginRequest,
  ): Promise<authContracts.LoginResponse> {
    return this.authService.login(body);
  }

  /**
   * BFF chama quando o access token expirou mas a sessão ainda é válida.
   * Usa rotation strategy: cada refresh token só pode ser usado uma vez.
   * Se um refresh token já usado aparecer → sinal de roubo → revoga tudo.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() body: authContracts.RefreshRequest,
  ): Promise<authContracts.RefreshResponse> {
    return this.authService.refresh(body);
  }

  /**
   * allDevices omitido ou false → logout da sessão atual
   * allDevices: true           → logout de todos os dispositivos
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() body: authContracts.LogoutRequest): Promise<void> {
    return this.authService.logout(body);
  }
}
