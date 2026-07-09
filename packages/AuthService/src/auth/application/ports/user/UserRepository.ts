import { User } from '../../../domain/entities/user.entity';
import { Atomic } from '../utils/Atomic';

export interface UserLoginData {
  id: string;
  passwordHash: string;
  emailVerified: boolean;
  accountLocked: boolean;
  failedLoginCount: number;
  deletedAt: Date | null;
}

export abstract class UserRepository {
  // ---------------------------------------------
  //                   Queries
  // ---------------------------------------------

  /**
   * Finds a user by their email and returns the login data.
   *
   * @param email The email of the user to find.
   * @returns A promise that resolves to the user's login data or null if not found.
   * @throws An error if the query fails.
   */
  abstract findLoginDataByEmail(email: string): Atomic<UserLoginData | null>;

  /**
   * Checks if a user exists by their email.
   *
   * @param email The email of the user to check.
   * @returns A promise that resolves to true if the user exists, false otherwise.
   * @throws An error if the query fails.
   */
  abstract existsByEmail(email: string): Promise<boolean>;

  // ---------------------------------------------
  //                   Commands
  // ---------------------------------------------

  /**
   * Finds a user by their ID.
   *
   * @param id The ID of the user to find.
   * @returns A promise that resolves to the user entity or null if not found.
   * @throws An error if the query fails.
   */
  abstract findById(id: string): Atomic<User | null>;

  /**
   * Saves a new user to the repository.
   *
   * @param user The user entity to be saved.
   * @returns A promise that resolves when the user is successfully saved.
   * @throws An error if the save operation fails.
   */
  abstract save(user: User): Atomic<User>;

  /**
   * Updates an existing user's data in the repository.
   *
   * @param id The ID of the user to update.
   * @param user A partial user object containing the fields to update.
   * @returns A promise that resolves when the user is successfully updated.
   * @throws An error if the update operation fails or if the user does not exist.
   */
  abstract update(id: string, user: Partial<Omit<User, 'id'>>): Atomic<User>;
}
