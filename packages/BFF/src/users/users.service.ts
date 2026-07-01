import { Injectable } from '@nestjs/common';
import { CircuitBreaker } from '../.shared/CircuitBreaker/CircuitBreaker';

@Injectable()
export class UsersService {
  private breaker: CircuitBreaker;
  constructor() {
    this.breaker = new CircuitBreaker({
      maxAttempts: 3,
      halfOpenAfter: 5000,
      consecutiveBreaker: 2,
      timeout: 2000,
    });
  }
}
