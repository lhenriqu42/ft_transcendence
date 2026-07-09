import { HttpException } from '@nestjs/common';
import { ChallengePayload } from '../ports/session/ChallengeRepository';
import { LoginFailureReason } from '../../../infra/prisma/generated/enums';

export class LoginError extends Error {
  constructor(
    public httpException: HttpException,
    public reason: LoginFailureReason,
    public challengeData: ChallengePayload,
  ) {
    super(httpException.message);
  }
}
