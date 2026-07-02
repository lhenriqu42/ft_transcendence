import { HttpException } from '@nestjs/common';
import { LoginFailureReason } from '../../.shared/prisma/generated/enums';
import { ChallengePayload } from '../application/challenge.service';

export class LoginError extends Error {
  constructor(
    public httpException: HttpException,
    public reason: LoginFailureReason,
    public challengeData: ChallengePayload,
  ) {
    super(httpException.message);
  }
}
