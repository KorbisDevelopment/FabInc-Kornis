export enum OperationalRole {
  OPERATOR = 'operator',
  EXPERT = 'expert',
}

export interface Project {
  id: string;
  name: string;
  accessCode: string;
}

export interface Telemetry {
  rpm: number;
  temp: number;
}

export interface Advice {
  id: string;
  identifier: string;
  text: string;
  importance: 'critical' | 'high' | 'normal' | 'low';
  createdAt: number;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface CameraFeed {
  id: string;
  label: string;
  streamId: string;
  isOnline: boolean;
  isCritical?: boolean;
  location?: string;
}
