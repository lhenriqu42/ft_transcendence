export interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner: string;
  accent_color: null | number;
  global_name: string;
  avatar_decoration_data: null | string;
  collectibles: DiscordCollectibles;
  display_name_styles: DiscordDisplayNameStyles;
  banner_color: null;
  clan: DiscordClan;
  primary_guild: DiscordClan;
  mfa_enabled: boolean;
  locale: 'pt-BR';
  premium_type: 0;
  email: 'xluizikax@gmail.com';
  verified: boolean;
}

export interface DiscordCollectibles {
  nameplate: DiscordNameplate;
}

export interface DiscordNameplate {
  sku_id: string;
  asset: string;
  label: string;
  palette: string;
}

export interface DiscordDisplayNameStyles {
  font_id: number;
  effect_id: number;
  colors: number[];
}

export interface DiscordClan {
  identity_guild_id: string;
  identity_enabled: true;
  tag: 'CODE';
  badge: '5aa44a4146ec1260c312c8a037be7ad2';
}

export interface DiscordIdTokenClaims {
  iss: 'https://discord.com';
  aud: string[];
  iat: number;
  exp: number;
  auth_time: number;
  at_hash: string;
  sub: string;
}
