import { SessionRevokedReason } from '../../../infra/prisma/generated/enums';

export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly deviceId: string,
    public readonly createdAt: Date,
    public readonly revokedAt: Date | null,
    public readonly revokedReason: SessionRevokedReason | null,
  ) {}
}
