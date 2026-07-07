export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public passwordHash: string,
    public emailVerified: boolean,
    public accountLocked: boolean,
    public failedLoginCount: number,
    public createdAt: Date,
    public updatedAt: Date,
    public lastLoginAt: Date | null,
    public deletedAt: Date | null,
  ) {}
}
