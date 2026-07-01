import {
  wrap,
  retry,
  timeout,
  handleAll,
  RetryPolicy,
  IMergedPolicy,
  IRetryContext,
  TimeoutPolicy,
  circuitBreaker,
  TimeoutStrategy,
  ConsecutiveBreaker,
  ExponentialBackoff,
  ICancellationContext,
  CircuitBreakerPolicy,
  IDefaultPolicyContext,
} from 'cockatiel';

export interface Policy {
  maxAttempts: number; // Total attempts before giving up
  halfOpenAfter: number; // Time in milliseconds for the half-open state after the open state
  consecutiveBreaker: number; // Number of consecutive failures to open the circuit
  timeout: number; // Time limit for the operation execution
}

export class CircuitBreaker {
  private resilientPolicy: IMergedPolicy<
    ICancellationContext & IRetryContext & IDefaultPolicyContext,
    never,
    [TimeoutPolicy, RetryPolicy, CircuitBreakerPolicy]
  >;

  constructor(policy: Policy) {
    const retryPolicy = retry(handleAll, {
      maxAttempts: policy.maxAttempts,
      backoff: new ExponentialBackoff(),
    });

    const breakerPolicy = circuitBreaker(handleAll, {
      halfOpenAfter: policy.halfOpenAfter,
      breaker: new ConsecutiveBreaker(policy.consecutiveBreaker),
    });

    const timeoutPolicy = timeout(policy.timeout, TimeoutStrategy.Aggressive);

    this.resilientPolicy = wrap(retryPolicy, breakerPolicy, timeoutPolicy);
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    return await this.resilientPolicy.execute(fn);
  }
}
