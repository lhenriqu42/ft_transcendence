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

export type IpCtxResponse = LoginIpContext | IpCtxFailure;

export abstract class IpLookup {
  /**
   * Fetches the IP context for a given IP address.
   *
   * @param ip The IP address to look up.
   * @returns A promise that resolves to the IP context or an error message.
   * @throws An error if the lookup fails.
   */
  abstract fetch(ip: string): Promise<IpCtxResponse>;
}
