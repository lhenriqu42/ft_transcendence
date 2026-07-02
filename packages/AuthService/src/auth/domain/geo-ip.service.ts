export interface LoginIpContext {
  ip: string;
  success: true;
  connection?: {
    asn?: number;
    isp?: string;
    org?: string;
    domain?: string;
  };
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface IpCtxFailure {
  ip: string;
  success: false;
  message: string;
}

type IpCtxResponse = LoginIpContext | IpCtxFailure;

export class GeoIPService {
  async lookup(ip: string): Promise<LoginIpContext> {
    const response = await fetch(`https://ipwho.is/${ip}`);
    const ctx = (await response.json()) as IpCtxResponse;

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
