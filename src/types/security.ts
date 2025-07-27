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