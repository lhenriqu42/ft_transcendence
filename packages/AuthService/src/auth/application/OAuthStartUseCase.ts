import { Injectable } from '@nestjs/common';
import * as CI from './contracts/auth.contracts';
import { OAuthProviderFactory } from './ports/utils/OAuthProviderFactory';

@Injectable()
export class OAuthStartUseCase {
  constructor(private readonly oAuthProviderFactory: OAuthProviderFactory) {}

  async execute(body: CI.OAuthStartRequest): Promise<CI.OAuthStartResponse> {
    const provider = this.oAuthProviderFactory.get(body.provider);
    const authorizationUrl = await provider.createAuthorizationUrl();
    return { authorizationUrl };
  }
}
