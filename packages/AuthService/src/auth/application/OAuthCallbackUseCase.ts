import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OAuthService } from './providers/oauth.service';
import { OAuthLoginUseCase } from './OAuthLoginUseCase';
import { OAuthLinkUseCase } from './OAuthLinkUseCase';
import * as CI from './contracts/auth.contracts';

@Injectable()
export class OAuthCallbackUseCase {
  constructor(
    private readonly oAuthService: OAuthService,
    private readonly oAuthLinkUseCase: OAuthLinkUseCase,
    private readonly oAuthLoginUseCase: OAuthLoginUseCase,
  ) {}

  async execute(
    body: CI.OAuthCallbackRequest,
  ): Promise<CI.OAuthCallbackResponse> {
    const data = await this.oAuthService.getStateData(body.state);
    const { intent, userId } = data;

    const { identity, tokens } = await this.oAuthService.getIdentity(
      data.provider,
      body.code,
      body.state,
    );

    let user: CI.OAuthCallbackResponse | null = null;
    if (intent === 'link') {
      user = await this.oAuthLinkUseCase.execute({
        prevUID: userId,
        currUID: body.sub,
        info: { identity, tokens },
      });
    } else if (intent === 'login') {
      user = await this.oAuthLoginUseCase.execute({ identity, tokens });
    } else {
      throw new InternalServerErrorException('Invalid intent');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      accountLocked: user.accountLocked,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}
