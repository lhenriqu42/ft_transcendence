export class PasswordHistory {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
  ) {}
}
