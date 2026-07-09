export interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

export interface GoogleIdTokenClaims {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  iat: number;
  exp: number;
}
