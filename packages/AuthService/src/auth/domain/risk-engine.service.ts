import { Injectable } from '@nestjs/common';
import { Device } from './entities/device.entity';
import { LoginIpContext } from '../application/ports/IpLookup';

enum RiskValues {
  // --- CATEGORIA 1: DADOS AUSENTES OU INCOMPLETOS (Sinal de automação/bot) ---
  MISSING_FINGERPRINT = 20,
  MISSING_USER_AGENT = 25,
  MISSING_IP = 30,

  // --- CATEGORIA 2: ANOMALIAS DE CONTEXTO (Mudanças suspeitas) ---
  NEW_DEVICE = 15, // Primeiro login vindo de um fingerprint novo
  NEW_COUNTRY = 40, // País diferente do padrão habitual do usuário
  NEW_CITY = 16, // Cidade diferente, mas no mesmo país
  SUSPICIOUS_ASN = 35, // Conexão vinda de um provedor suspeito (ex: data center/VPN comercial)

  // --- CATEGORIA 3: HISTÓRICO E COMPORTAMENTO (Ações recentes na conta) ---
  RECENT_FAILED_LOGINS_LOW = 10, // 1 a 3 tentativas falhas recentes
  RECENT_FAILED_LOGINS_HIGH = 31, // Mais de 3 tentativas falhas recentes (alerta de brute-force)
  PASSWORD_RECENTLY_CHANGED = 21, // Login logo após troca de senha em outro contexto
  IMPOSSIBLE_FETCH_DEVICE = 38, // Nao foi enviado nem userAgent nem fingerprint, impossibilitando identificar o dispositivo

  // --- CATEGORIA 4: REGRAS CRÍTICAS (Gatilhos imediatos de fraude) ---
  IMPOSSIBLE_TRAVEL = 80, // Login no Brasil e 15 minutos depois na Europa (distância física impossível)
  IP_BLACK_LISTED = 75, // IP listado em bases de spam, botnets ou redes Tor conhecido
  REUSE_REFRESH_TOKEN = 90, // Tentativa de usar um Refresh Token que já foi consumido (indício de roubo de sessão)
}

// All Information needed to evaluate the risk of a login attempt
interface RiskInfo {
  ipInfo: LoginIpContext;
  userInfo: {
    id: string;
    failedLoginCount: number;
  };
  requestInfo: {
    userAgent?: string;
    deviceFingerprint?: string;
  };
  deviceInfo: Device | null;
}

@Injectable()
export class RiskEngineService {
  constructor() {}

  evaluate(info: RiskInfo) {
    let riskScore = 0;

    const { deviceFingerprint, userAgent } = info.requestInfo;

    // Futuramente avaliar a geolocalização do IP e comparar com o histórico do usuário
    const { ip } = info.ipInfo;

    if (!ip) riskScore += RiskValues.MISSING_IP;
    if (!info.deviceInfo) riskScore += RiskValues.NEW_DEVICE;
    if (!userAgent) riskScore += RiskValues.MISSING_USER_AGENT;
    if (!deviceFingerprint) riskScore += RiskValues.MISSING_FINGERPRINT;

    if (info.userInfo.failedLoginCount > 0) {
      riskScore +=
        info.userInfo.failedLoginCount >= 3
          ? RiskValues.RECENT_FAILED_LOGINS_HIGH
          : RiskValues.RECENT_FAILED_LOGINS_LOW;
    }

    riskScore = Math.min(riskScore, 100);
    return riskScore;
  }
}
