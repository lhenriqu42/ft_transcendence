export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly jti: string,
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly tokenHash: string,
    public readonly familyId: string,
    public readonly parentTokenId: string | null,
    public readonly consumed: boolean,
    public readonly consumedAt: Date | null,
    public readonly revoked: boolean,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
  ) {}
}
