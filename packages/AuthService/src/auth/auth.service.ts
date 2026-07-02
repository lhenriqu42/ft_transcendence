import { ChallengeService } from './application/challenge.service';
import * as CI from './contracts/auth.contracts';
import { LoginService } from './application/login.service';

export class AuthService {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly loginService: LoginService,
    // private readonly logoutService: LogoutService,
    // private readonly registerService: RegisterService,
  ) {}

  challenge(dto: CI.ChallengeRequest): Promise<CI.ChallengeResponse> {
    return this.challengeService.execute(dto);
  }

  login(dto: CI.LoginRequest): Promise<CI.LoginResponse> {
    return this.loginService.execute(dto);
  }

  // logout(dto: CI.LogoutRequest): Promise<CI.LogoutResponse> {
  //   return this.logoutService.execute(dto);
  // }

  // register(dto: CI.RegisterRequest): Promise<CI.RegisterResponse> {
  //   return this.registerService.execute(dto);
  // }
}
