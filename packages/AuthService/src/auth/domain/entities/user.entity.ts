export class User {
  constructor(
    public readonly id: string,
    public name: string | null,
    public email: string,
    public passwordHash: string | null,
    public emailVerified: boolean | null,
    public accountLocked: boolean,
    public failedLoginCount: number,
    public createdAt: Date,
    public updatedAt: Date,
    public lastLoginAt: Date | null,
    public deletedAt: Date | null,
  ) {}
}
