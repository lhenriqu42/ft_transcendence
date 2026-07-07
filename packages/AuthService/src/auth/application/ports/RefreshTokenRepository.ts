import { Atomic } from './Atomic';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';

export interface CreateRefreshTokenDTO {
  jti: string; // gerado pelo SessionService, embutido no token bruto entregue ao cliente
  userId: string;
  sessionId: string;
  refreshToken: string; // "secret" (parte que é hasheada) — sem o jti
  expiresIn: number; // Expiration time of the refresh token in seconds since now.
  familyId?: string; // se ausente, uma nova família é iniciada
  parentTokenId?: string | null; // token que originou este, via rotação
}

export abstract class RefreshTokenRepository {
  /**
   * Creates a new refresh token in the repository.
   */
  abstract create(token: CreateRefreshTokenDTO): Atomic<RefreshToken>;

  /**
   * Deletes a refresh token from the repository.
   */
  abstract delete(token: RefreshToken): Atomic<RefreshToken>;

  /**
   * Marks a refresh token as consumed in the repository.
   */
  abstract consume(jti: string): Atomic<RefreshToken>;

  /**
   * Marks a refresh token as revoked in the repository.
   */
  abstract revoke(jti: string): Atomic<RefreshToken>;

  /**
   * Revoga todos os tokens de uma família (usado quando um reuse/roubo é detectado).
   *
   * @param familyId O identificador da família de refresh tokens a ser revogada.
   * @returns Quantidade de tokens afetados.
   */
  abstract revokeFamily(familyId: string): Atomic<{ count: number }>;

  /**
   * Consome atomicamente o token antigo (somente se ainda não consumido/revogado)
   * e cria o próximo token da família na mesma transação.
   *
   * @throws RefreshTokenReuseError se o token antigo já estiver consumido/revogado
   * no momento da atualização (corrida ou reuse).
   */
  abstract rotate(
    oldJti: string,
    newToken: CreateRefreshTokenDTO,
  ): Promise<RefreshToken>;

  /**
   * Finds a refresh token by its unique identifier (jti).
   */
  abstract findByJti(jti: string): Atomic<RefreshToken | null>;

  /**
   * Revoga todos os refresh tokens vinculados a uma sessão (logout de 1 device).
   */
  abstract revokeBySessionId(sessionId: string): Atomic<{ count: number }>;

  /**
   * Revoga todos os refresh tokens de um usuário (logout de todos os devices).
   */
  abstract revokeAllByUserId(userId: string): Atomic<{ count: number }>;
}
