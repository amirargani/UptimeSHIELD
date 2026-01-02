export enum ServiceStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  RESTARTING = 'RESTARTING',
  FAILED = 'FAILED', // Critical failure requiring manual intervention
  PAUSED = 'PAUSED' // Monitoring paused
}

export interface Service {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number; // percentage
  lastRestart: Date | null;
  failCount: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  serviceId: string | null;
  serviceName: string | null;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
}

export interface AppSettings {
  emailNotifications: boolean;
  recipientEmail: string;
  smtpServer: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  checkInterval: number; // seconds
  autoRestart: boolean;
  maxRetries: number;
}

export type View = 'overview' | 'services' | 'logs' | 'configuration' | 'ai-analysis';