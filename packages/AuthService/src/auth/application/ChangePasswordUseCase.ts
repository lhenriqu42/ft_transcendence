import { PasswordHistoryRepository } from './ports/user/PasswordHistoryRepository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository, UnitOfWork, Atomic } from './ports';
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

    const promises: Atomic<unknown>[] = [
      this.userRepo.update(userId, { passwordHash: newPasswordHash }),
    ];

    if (user.passwordHash) {
      promises.push(
        this.passwordHistoryRepo.save({
          userId,
          passwordHash: user.passwordHash,
        }),
      );
    }

    return this.uof.runBatch(promises) as unknown as Promise<void>;
  }
}
