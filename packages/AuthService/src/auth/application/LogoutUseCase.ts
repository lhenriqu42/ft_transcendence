import { Injectable } from '@nestjs/common';
import * as CI from './contracts/auth.contracts';
import { SessionService } from './providers/session.service';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly sessionService: SessionService) {}

  execute(body: CI.LogoutRequest) {
    return this.sessionService.logout(
      body.userId,
      body.sessionId,
      body.allDevices,
    );
  }
}
