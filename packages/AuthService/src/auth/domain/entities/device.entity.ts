export class Device {
  constructor(
    public readonly id: string,
    public userId: string,
    public fingerprintHash: string | null,
    public lastUserAgent: string | null,
    public name: string | null,
    public firstSeenAt: Date,
    public lastSeenAt: Date,
    public loginCount: number,
  ) {}
}
