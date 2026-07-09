import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ChangePasswordUseCase } from './ChangePasswordUseCase';
import * as CI from '../application/contracts/auth.contracts';
import { PasswordResetRepository } from './ports';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly passwordResetRepo: PasswordResetRepository,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  async execute(
    body: CI.ResetPasswordRequest,
  ): Promise<CI.ResetPasswordResponse> {
    const userId = await this.passwordResetRepo.getUserIdByTokenHash(
      body.token,
    );

    if (!userId) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    await Promise.all([
      this.passwordResetRepo.deleteChallenge(body.token),
      this.changePasswordUseCase.execute(userId, body.newPassword),
    ]);

    return {
      success: true,
      message: 'Senha redefinida com sucesso',
    };
  }
}
