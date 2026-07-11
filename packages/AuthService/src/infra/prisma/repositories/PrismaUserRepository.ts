import { PrismaService } from '../prisma.service';
import { Injectable } from '@nestjs/common';
import { User } from '../../../auth/domain/entities/user.entity';
import {
  UserLoginData,
  UserRepository,
} from '../../../auth/application/ports/user/UserRepository';
import { Atomic } from '../../../auth/application/ports/utils/Atomic';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLoginDataByEmail(email: string): Atomic<UserLoginData | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        emailVerified: true,
        accountLocked: true,
        failedLoginCount: true,
        deletedAt: true,
      },
    });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.prisma.user
      .count({
        where: { email },
      })
      .then((count) => count > 0);
  }

  findByEmail(email: string): Atomic<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  save(user: User): Atomic<User> {
    return this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        emailVerified: user.emailVerified,
        accountLocked: user.accountLocked,
        failedLoginCount: user.failedLoginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        deletedAt: user.deletedAt,
      },
    });
  }

  update(id: string, user: Partial<Omit<User, 'id'>>): Atomic<User> {
    return this.prisma.user.update({
      where: { id },
      data: user,
    });
  }

  findById(id: string): Atomic<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
