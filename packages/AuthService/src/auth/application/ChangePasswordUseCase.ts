import { PasswordHistoryRepository } from './ports/PasswordHistoryRepository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UnitOfWork } from './ports/unit-of-work';
import { UserRepository } from './ports';
import * as argon2 from 'argon2';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly uof: UnitOfWork,
    private readonly userRepo: UserRepository,
    private readonly passwordHistoryRepo: PasswordHistoryRepository,
  ) {}

  async execute(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newPasswordHash = await argon2.hash(newPassword);

    return this.uof.runBatch([
      this.userRepo.update(userId, { passwordHash: newPasswordHash }),
      this.passwordHistoryRepo.save({
        userId,
        passwordHash: user.passwordHash,
      }),
    ]) as unknown as Promise<void>;
  }
}
