import { LoginIpContext } from '../ports/IpLookup';
import { IpLookup } from '../ports/IpLookup';

export class IpInfoService {
  constructor(private readonly ipLookup: IpLookup) {}

  async lookup(ip: string): Promise<LoginIpContext> {
    const ctx = await this.ipLookup.fetch(ip);

    if (!ctx.success) {
      console.log(
        `[GeoIPService] Failed to lookup IP address ${ip}: ${ctx.message}`,
      );
      return {
        ip: ctx.ip,
        success: true,
        country: undefined,
        city: undefined,
        latitude: undefined,
        longitude: undefined,
        connection: {
          asn: undefined,
          isp: undefined,
          org: undefined,
          domain: undefined,
        },
      };
    }

    return ctx;
  }
}
