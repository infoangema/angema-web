export interface UserSession {
  uid: string;
  email: string;
  displayName?: string;
  roleId: string;
  businessId?: string;
  isActive: boolean;
  lastLogin: number;
  accessToken?: string;
  createdAt?: number;
  password?: string; // Opcional, solo usado temporalmente durante la creación
}

export interface SessionConfig {
  sessionTimeout: number;      // 1 hora por defecto
  refreshTokenTimeout: number; // 2 horas por defecto
  maxInactivityTime: number;   // 30 minutos por defecto
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionTimeout: 3600000,      // 1 hora
  refreshTokenTimeout: 7200000, // 2 horas
  maxInactivityTime: 1800000   // 30 minutos
}; 