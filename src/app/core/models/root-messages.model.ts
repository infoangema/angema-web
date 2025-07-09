export interface RootMessage {
  id: string;
  type: 'business_request' | 'support_request' | 'system_alert' | 'feature_request' | 'bug_report';
  title: string;
  message: string;
  fromEmail: string;
  fromName: string;
  businessName?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: any;
  updatedAt: any;
  resolvedAt?: any;
  resolvedBy?: string;
  notes?: string;
  attachments?: string[];
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    source?: string;
    [key: string]: any;
  };
}

export interface BusinessRequestMessage extends RootMessage {
  type: 'business_request';
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;
  planRequested: 'basic' | 'premium' | 'enterprise';
  estimatedUsers: number;
  industry?: string;
  requirements?: string;
}

export interface SupportRequestMessage extends RootMessage {
  type: 'support_request';
  category: 'technical' | 'billing' | 'feature' | 'bug' | 'general';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  userBusinessId?: string;
  userRole?: string;
}

export interface SystemAlertMessage extends RootMessage {
  type: 'system_alert';
  alertLevel: 'info' | 'warning' | 'error' | 'critical';
  affectedServices?: string[];
  impact?: string;
  resolution?: string;
}

export interface FeatureRequestMessage extends RootMessage {
  type: 'feature_request';
  featureName: string;
  description: string;
  useCase: string;
  impact: 'low' | 'medium' | 'high';
  estimatedUsers?: number;
}

export interface BugReportMessage extends RootMessage {
  type: 'bug_report';
  bugTitle: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  browser?: string;
  os?: string;
  userBusinessId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Tipos de mensajes disponibles
export type RootMessageType = 
  | BusinessRequestMessage 
  | SupportRequestMessage 
  | SystemAlertMessage 
  | FeatureRequestMessage 
  | BugReportMessage;

// Estados de los mensajes
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
} as const;

// Prioridades de los mensajes
export const MESSAGE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

// Tipos de mensajes
export const MESSAGE_TYPES = {
  BUSINESS_REQUEST: 'business_request',
  SUPPORT_REQUEST: 'support_request',
  SYSTEM_ALERT: 'system_alert',
  FEATURE_REQUEST: 'feature_request',
  BUG_REPORT: 'bug_report'
} as const; 