import { Device } from '../../domain/entities/device.entity';
import { Atomic } from './Atomic';

export type DataToIncrement = {
  userId: string;
  deviceId: string | null;
  userAgent: string | null;
  fingerprint: string | null;
};

export abstract class DeviceRepository {
  /**
   * Increments the login count for a device associated with a user.
   * If the device does not exist, it will be created with an initial login count of 1.
   *
   * @param user_id The ID of the user associated with the device.
   * @param fingerprint The fingerprint of the device.
   * @returns A promise that resolves to the updated device entity.
   * @throws An error if the operation fails or if the device does not exist.
   */
  abstract createOrincrementLoginCount(
    data: DataToIncrement,
  ): Promise<[Atomic<Device>, boolean]>;

  /**
   * Finds a device associated with a user by its fingerprint.
   *
   * @param user_id The ID of the user associated with the device.
   * @param fingerprint The fingerprint of the device to find.
   * @returns A promise that resolves to the found device entity or null if not found.
   * @throws An error if the query operation fails.
   */
  abstract findById(userId: string, deviceId: string): Atomic<Device | null>;
}
