import { Injectable } from '@nestjs/common';
import { IpCtxResponse, IpLookup } from '../../auth/application/ports/IpLookup';

@Injectable()
export class IpLookupImpl extends IpLookup {
  async fetch(ip: string): Promise<IpCtxResponse> {
    const response = await fetch(`https://ipwho.is/${ip}`);
    return response.json() as Promise<IpCtxResponse>;
  }
}
