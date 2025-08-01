export interface NetworkPacket {
  id: string;
  timestamp: number;
  sourceIP: string;
  destIP: string;
  sourcePort: number;
  destPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS';
  size: number;
  flags: string[];
  payload?: string;
}

export interface ThreatAlert {
  id: string;
  timestamp: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'MALWARE' | 'INTRUSION' | 'ANOMALY' | 'BRUTE_FORCE' | 'DDoS' | 'DATA_EXFILTRATION';
  sourceIP: string;
  destIP?: string;
  description: string;
  confidence: number;
  blocked: boolean;
  resolved: boolean;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  threatsBlocked: number;
  timestamp: number;
}

export interface MLModel {
  name: string;
  accuracy: number;
  lastTrained: number;
  status: 'ACTIVE' | 'TRAINING' | 'INACTIVE';
  detectionTypes: string[];
}

export interface NetworkNode {
  id: string;
  ip: string;
  hostname: string;
  type: 'SERVER' | 'WORKSTATION' | 'ROUTER' | 'FIREWALL' | 'UNKNOWN';
  status: 'ONLINE' | 'OFFLINE' | 'SUSPICIOUS';
  lastSeen: number;
  threatLevel: number;
}

export interface SystemProcess {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  user: string;
  startTime: number;
  suspicious: boolean;
}

export interface FileSystemEvent {
  id: string;
  timestamp: number;
  type: 'CREATE' | 'MODIFY' | 'DELETE' | 'ACCESS';
  path: string;
  user: string;
  size?: number;
  suspicious: boolean;
}

export interface SecurityReport {
  id: string;
  timestamp: number;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INCIDENT';
  title: string;
  summary: string;
  threatsDetected: number;
  threatsBlocked: number;
  networkEvents: number;
  systemEvents: number;
  riskScore: number;
  recommendations: string[];
  data: any;
}

export interface RealTimeConfig {
  networkMonitoring: boolean;
  hostMonitoring: boolean;
  fileSystemWatching: boolean;
  processMonitoring: boolean;
  logAnalysis: boolean;
  realTimeAlerts: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  source: 'NETWORK' | 'HOST' | 'FILESYSTEM' | 'PROCESS' | 'SYSTEM';
  message: string;
  details?: any;
}