import { ForbiddenException, Injectable } from '@nestjs/common';
import * as CI from './contracts/auth.contracts';
import { UserRepository } from './ports';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class RegisterService {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(body: CI.RegisterRequest): Promise<CI.RegisterResponse> {
    if (await this.userRepo.existsByEmail(body.email)) {
      throw new ForbiddenException('Email already in use');
    }

    // Hash the password before saving it to the database
    body.password = await argon2.hash(body.password);

    const id = randomUUID(); // Generate a unique ID for the new user

    await this.userRepo.save({
      id,
      name: body.name,
      email: body.email,
      passwordHash: body.password,
      failedLoginCount: 0,
      accountLocked: false,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      lastLoginAt: null,
    });
    return { userId: id };
  }
}
