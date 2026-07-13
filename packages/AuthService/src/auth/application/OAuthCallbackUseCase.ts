import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthService } from './providers/oauth.service';
import { OAuthLoginUseCase } from './OAuthLoginUseCase';
import { OAuthLinkUseCase } from './OAuthLinkUseCase';
import * as CI from './contracts/auth.contracts';
import { IpInfoService } from './providers/ip-info.service';

@Injectable()
export class OAuthCallbackUseCase {
  constructor(
    private readonly oAuthService: OAuthService,
    private readonly ipInfoService: IpInfoService,
    private readonly oAuthLinkUseCase: OAuthLinkUseCase,
    private readonly oAuthLoginUseCase: OAuthLoginUseCase,
  ) {}

  async execute(
    body: CI.OAuthCallbackRequest,
  ): Promise<CI.OAuthCallbackResponse> {
    const data = await this.oAuthService.getStateData(body.state);
    const { intent, userId, ip } = data;

    const [newIpCtx, { identity, tokens }] = await Promise.all([
      this.ipInfoService.lookup(body.ip),
      this.oAuthService.getIdentity(data.provider, body.code, body.state),
    ]);

    if (ip !== newIpCtx.ip) {
      throw new UnauthorizedException(
        'IP address mismatch between OAuth state and callback request',
      );
    }

    if (intent === 'link') {
      return this.oAuthLinkUseCase.execute({
        prevUID: userId,
        currUID: body.sub,
        info: { identity, tokens },
      });
    } else if (intent === 'login') {
      return this.oAuthLoginUseCase.execute({
        identity,
        tokens,
        ipContext: newIpCtx,
        prevDID: data.deviceId,
        currDID: body.deviceId,
        userAgent: data.userAgent,
        deviceFingerprint: data.deviceFingerprint,
      });
    } else {
      throw new InternalServerErrorException('Invalid intent');
    }
  }
}
