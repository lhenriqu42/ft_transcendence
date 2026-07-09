import { LoginIpContext } from '../utils/IpLookup';

export interface ChallengePayload {
  user: {
    id: string;
    email: string;
    passwordHash: string;
    accountLocked: boolean;
    failedLoginCount: number;
    deletedAt: Date | null;
  };
  ipContext: LoginIpContext;
  riskScore: number;
  deviceId: string | null;
  deviceFingerprint: string | null;
  userAgent: string | null;
  requiresCaptcha: boolean;
  requiresMFA: boolean;
}

export abstract class ChallengeRepository {
  /**
   * Saves the challenge payload and returns the generated challenge ID.
   *
   * @param payload The challenge payload to be saved.
   * @param timeout The timeout for the challenge in seconds.
   * @returns A promise that resolves to the generated challenge ID.
   */
  abstract save(payload: ChallengePayload, timeout?: number): Promise<string>;

  /**
   * Finds a challenge by ID.
   *
   * @param id Challenge identifier
   */
  abstract find(id: string): Promise<ChallengePayload | null>;

  /**
   * Deletes a challenge by ID.
   *
   * @param id Challenge identifier
   */
  abstract delete(id: string): Promise<void>;
}
