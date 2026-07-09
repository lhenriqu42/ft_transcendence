import { UserRepository, PasswordResetRepository } from './ports';
import * as CI from './contracts/auth.contracts';
import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordResetRepo: PasswordResetRepository,
  ) {}

  async execute(
    input: CI.ForgotPasswordRequest,
  ): Promise<CI.ForgotPasswordResponse> {
    const user = await this.userRepo.findLoginDataByEmail(input.email);

    if (!user) {
      return {
        success: false,
        message: `Usuário não encontrado para o email ${input.email}`,
      };
    }

    const token = this.generateToken();
    const tokenHash = this.hashToken(token);

    await this.passwordResetRepo.saveChallenge(tokenHash, user.id);

    // Aqui você enviaria o token para o email do usuário
    // await this.emailService.sendPasswordResetEmail(user.email, token);

    return {
      success: true,
      message: `Token de redefinição de senha enviado para ${input.email}`,
    };
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
