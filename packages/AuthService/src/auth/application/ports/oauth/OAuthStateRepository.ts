import { OAuthProviderType } from '../../contracts/auth.contracts';

export interface OAuthStateData {
  intent: 'link' | 'login';
  provider: OAuthProviderType;
  codeVerifier: string | null;
  userId: string | null;
}

export abstract class OAuthStateRepository {
  abstract save(
    state: string,
    data: OAuthStateData,
    ttlSeconds: number,
  ): Promise<void>;

  abstract find(state: string): Promise<OAuthStateData | null>;

  abstract delete(state: string): Promise<void>;
}
