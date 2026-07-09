import { Device } from '../../../auth/domain/entities/device.entity';
import { Atomic } from '../../../auth/application/ports/utils/Atomic';
import {
  DataToIncrement,
  DeviceRepository,
} from '../../../auth/application/ports/session/DeviceRepository';
import { PrismaService } from '../prisma.service';
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class PrismaDeviceRepository implements DeviceRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrincrementLoginCount(
    data: DataToIncrement,
  ): Promise<[Atomic<Device>, boolean]> {
    const { userId, deviceId, fingerprint, userAgent } = data;
    const safeUserAgent = userAgent?.slice(0, 255) ?? null;
    const now = new Date();

    const fingerprintHash = fingerprint
      ? createHash('sha256').update(fingerprint).digest('hex')
      : null;

    if (deviceId) {
      const existing = await this.prismaService.device.findFirst({
        where: { id: deviceId, userId },
      });

      if (existing) {
        const fingerprintChanged =
          fingerprintHash &&
          existing.fingerprintHash &&
          existing.fingerprintHash !== fingerprintHash;

        return [
          this.prismaService.device.update({
            where: { id: deviceId },
            data: {
              lastSeenAt: now,
              loginCount: { increment: 1 },
              ...(safeUserAgent && { lastUserAgent: safeUserAgent }),
            },
          }),
          !!fingerprintChanged,
        ];
      }
    }

    return [
      this.prismaService.device.create({
        data: {
          userId,
          lastSeenAt: now,
          firstSeenAt: now,
          ...(safeUserAgent && { lastUserAgent: safeUserAgent }),
          ...(fingerprintHash && { fingerprintHash }),
        },
      }),
      false,
    ];
  }

  findById(userId: string, deviceId: string): Atomic<Device | null> {
    return this.prismaService.device.findFirst({
      where: { id: deviceId, userId },
    });
  }
}
