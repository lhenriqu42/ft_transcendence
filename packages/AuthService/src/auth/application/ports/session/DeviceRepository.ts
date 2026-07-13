import { Device } from '../../../domain/entities/device.entity';
import { Atomic } from '../utils/Atomic';

export type DataToCreate = {
  userId: string;
  deviceId: string | null;
  userAgent: string | null;
  fingerprint: string | null;
};

export abstract class DeviceRepository {
  /**
   * Finds a device associated with a user by its fingerprint. If the device does not exist, it creates a new device record.
   *
   * @param data The data required to find or create the device.
   * @returns A promise that resolves to the found or newly created device entity.
   * @throws An error if the query or creation operation fails.
   */
  abstract findOrCreate(data: DataToCreate): Promise<Device>;

  /**
   * Increments the login count for a device.
   *
   * @param deviceId The ID of the device for which to increment the login count.
   * @returns A promise that resolves when the operation is complete.
   * @throws An error if the update operation fails.
   */
  abstract incrementLoginCount(deviceId: string): Atomic<Device>;

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
