import { Injectable } from '@nestjs/common';
import { IpCtxResponse, IpLookup } from '../../auth/application/ports/IpLookup';

@Injectable()
export class IpLookupImpl extends IpLookup {
  async fetch(ip: string): Promise<IpCtxResponse> {
    console.log(`[IpLookupImpl] Fetching IP context for IP: ${ip}`);
    const response = await fetch(`https://ipwho.is/${ip}`);
    console.log(`[IpLookupImpl] Received response for IP ${ip}:`, response);
    return response.json() as Promise<IpCtxResponse>;
  }
}
