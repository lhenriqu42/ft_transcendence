import { Atomic } from './Atomic';

export abstract class UnitOfWork {
  /**
   * Executa um conjunto de operações atômicas em uma única transação.
   * Todas succeed ou todas fail juntas.
   */
  abstract runBatch<T extends readonly Atomic<unknown>[]>(
    operations: [...T],
  ): Promise<{ [K in keyof T]: T[K] extends Atomic<infer R> ? R : never }>;
}
