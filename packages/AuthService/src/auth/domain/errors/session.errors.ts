export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Refresh token inválido.');
    this.name = 'InvalidRefreshTokenError';
  }
}

export class RefreshTokenExpiredError extends Error {
  constructor() {
    super('Refresh token expirado.');
    this.name = 'RefreshTokenExpiredError';
  }
}

export class SessionMismatchError extends Error {
  constructor() {
    super('sessionId não corresponde ao refresh token informado.');
    this.name = 'SessionMismatchError';
  }
}

// Sinaliza que um refresh token já consumido/revogado foi reapresentado —
// indício de roubo/replay. Toda a família é revogada quando isso acontece.
export class RefreshTokenReuseError extends Error {
  constructor() {
    super('Reuse de refresh token detectado. Sessão revogada por segurança.');
    this.name = 'RefreshTokenReuseError';
  }
}
