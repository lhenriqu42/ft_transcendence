import { Injectable } from '@nestjs/common';
import * as CI from './contracts/auth.contracts';
import { SessionService } from './providers/session.service';

@Injectable()
export class LogoutService {
  constructor(private readonly sessionService: SessionService) {}

  async execute(body: CI.LogoutRequest): Promise<void> {}
}
