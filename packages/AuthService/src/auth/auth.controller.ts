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
import * as CI from './contracts/auth.contracts';
import { AuthService } from './auth.service';

@Controller('auth')
@UseGuards(SecretAuthGuard)
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * Passo 1 do login — BFF chama antes de mostrar o campo de senha.
   * Retorna se precisa de captcha/MFA e um challengeId com TTL curto.
   */
  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  challenge(@Body() body: CI.ChallengeRequest): Promise<CI.ChallengeResponse> {
    return this.authService.challenge(body);
  }

  /**
   * Passo 2 — BFF envia credenciais + challengeId previamente gerado.
   * IP e userAgent vêm no body pois o BFF é quem tem acesso ao cliente real.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: CI.LoginRequest): Promise<CI.LoginResponse> {
    return this.authService.login(body);
  }

  /**
   * BFF chama quando o access token expirou mas a sessão ainda é válida.
   * Usa rotation strategy: cada refresh token só pode ser usado uma vez.
   * Se um refresh token já usado aparecer → sinal de roubo → revoga tudo.
   */
  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // refresh(@Body() body: CI.RefreshRequest): Promise<CI.RefreshResponse> {
  //   return this.authService.refresh(body);
  // }

  /**
   * allDevices omitido ou false → logout da sessão atual
   * allDevices: true           → logout de todos os dispositivos
   */
  // @Post('logout')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // logout(@Body() body: CI.LogoutRequest): Promise<void> {
  //   return this.authService.logout(body);
  // }

  // @Post('register')
  // @HttpCode(HttpStatus.CREATED)
  // register(@Body() body: CI.RegisterRequest): Promise<CI.RegisterResponse> {
  //   return this.authService.register(body);
  // }
}
