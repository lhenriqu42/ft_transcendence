import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../.shared/prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class DeviceService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOrCreateDevice(
    userId: string,
    userAgent: string,
    fingerprint?: string,
  ) {
    const fingerprintHash = createHash('sha256')
      .update(fingerprint ?? userAgent)
      .digest('hex');

    const existing = await this.prismaService.device.findUnique({
      where: { userId_fingerprintHash: { userId, fingerprintHash } },
    });

    if (existing) {
      return this.prismaService.device.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date(), loginCount: { increment: 1 } },
      });
    }

    return this.prismaService.device.create({
      data: {
        userId,
        fingerprintHash,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
  }

  // markTrusted();

  // updateLastSeen();

  // remove();

  // list();

  // revoke();
}
