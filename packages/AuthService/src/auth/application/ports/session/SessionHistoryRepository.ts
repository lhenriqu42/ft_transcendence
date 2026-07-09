import { SessionRevokedReason } from '../../../../infra/prisma/generated/enums';
import { Session } from '../../../domain/entities/session.entity';
import { Atomic } from '../utils/Atomic';

export abstract class SessionHistoryRepository {
  /**
   * Saves a new session record in the repository.
   */
  abstract save(
    session: Omit<Session, 'revokedAt' | 'revokedReason'>,
  ): Atomic<Session>;

  /**
   * Finds all sessions associated with a specific user ID.
   */
  abstract findByUserId(userId: string): Atomic<Session[]>;

  /**
   * Finds a session by its unique ID.
   */
  abstract findById(id: string): Atomic<Session | null>;

  /**
   * Marks a single session as encerrada (revoked/closed).
   *
   * @param id O ID da sessão a ser encerrada.
   * @param revokedAt O instante em que a sessão foi encerrada.
   * @param reason O motivo do encerramento.
   */
  abstract close(
    id: string,
    revokedAt: Date,
    reason: SessionRevokedReason,
  ): Atomic<Session>;

  /**
   * Marks all active (não encerradas) sessions of a user as encerradas.
   *
   * @param userId O ID do usuário cujas sessões serão encerradas.
   * @param revokedAt O instante em que as sessões foram encerradas.
   * @param reason O motivo do encerramento.
   */
  abstract closeAllByUserId(
    userId: string,
    revokedAt: Date,
    reason: SessionRevokedReason,
  ): Atomic<{ count: number }>;
}
