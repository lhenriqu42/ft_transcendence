import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuthService } from './providers/oauth.service';
import * as CI from './contracts/auth.contracts';

@Injectable()
export class OAuthStartUseCase {
  constructor(private readonly oAuthService: OAuthService) {}

  async execute(body: CI.OAuthStartRequest): Promise<CI.OAuthStartResponse> {
    const { intent, userId } = body.info;

    if (intent === 'link' && !userId) {
      throw new UnauthorizedException(
        'Inconsistent request: userId is required for link intent',
      );
    }

    const authorizationUrl = await this.oAuthService.getAuthorizationUrl(
      body.provider,
      body.info,
    );

    return { authorizationUrl };
  }
}
