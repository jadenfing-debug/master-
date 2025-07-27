import { NetworkPacket, ThreatAlert, SystemMetrics, MLModel } from '../types/security';

export class SecurityEngine {
  private static instance: SecurityEngine;
  private packets: NetworkPacket[] = [];
  private alerts: ThreatAlert[] = [];
  private metrics: SystemMetrics[] = [];
  private models: MLModel[] = [];
  private isScanning = false;
  private listeners: ((data: any) => void)[] = [];

  private constructor() {
    this.initializeMLModels();
    this.generateRealTimeData();
  }

  static getInstance(): SecurityEngine {
    if (!SecurityEngine.instance) {
      SecurityEngine.instance = new SecurityEngine();
    }
    return SecurityEngine.instance;
  }

  private initializeMLModels() {
    this.models = [
      {
        name: 'Neural Network Anomaly Detector',
        accuracy: 94.7,
        lastTrained: Date.now() - 86400000,
        status: 'ACTIVE',
        detectionTypes: ['ANOMALY', 'INTRUSION']
      },
      {
        name: 'Random Forest Classifier',
        accuracy: 91.2,
        lastTrained: Date.now() - 43200000,
        status: 'ACTIVE',
        detectionTypes: ['MALWARE', 'BRUTE_FORCE']
      },
      {
        name: 'LSTM Behavioral Analyst',
        accuracy: 89.8,
        lastTrained: Date.now() - 172800000,
        status: 'TRAINING',
        detectionTypes: ['DATA_EXFILTRATION', 'ANOMALY']
      }
    ];
  }

  private generatePacket(): NetworkPacket {
    const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'ICMP'] as const;
    const suspiciousIPs = ['192.168.1.100', '10.0.0.15', '172.16.0.50'];
    const normalIPs = ['192.168.1.1', '192.168.1.10', '192.168.1.20', '8.8.8.8', '1.1.1.1'];
    
    const isSuspicious = Math.random() < 0.15;
    const sourceIP = isSuspicious 
      ? suspiciousIPs[Math.floor(Math.random() * suspiciousIPs.length)]
      : normalIPs[Math.floor(Math.random() * normalIPs.length)];

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      sourceIP,
      destIP: normalIPs[Math.floor(Math.random() * normalIPs.length)],
      sourcePort: Math.floor(Math.random() * 65536),
      destPort: Math.floor(Math.random() * 65536),
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      size: Math.floor(Math.random() * 1500) + 64,
      flags: ['SYN', 'ACK', 'FIN'].filter(() => Math.random() > 0.7)
    };
  }

  private analyzePacketForThreats(packet: NetworkPacket): ThreatAlert | null {
    const suspiciousPatterns = [
      { pattern: /192\.168\.1\.100/, type: 'INTRUSION' as const, severity: 'HIGH' as const },
      { pattern: /port.*22/, type: 'BRUTE_FORCE' as const, severity: 'MEDIUM' as const },
      { pattern: /size.*1500/, type: 'DDoS' as const, severity: 'HIGH' as const }
    ];

    const isMalicious = Math.random() < 0.12;
    
    if (isMalicious || packet.sourceIP === '192.168.1.100') {
      const threatTypes = ['MALWARE', 'INTRUSION', 'ANOMALY', 'BRUTE_FORCE', 'DDoS'] as const;
      const severities = ['MEDIUM', 'HIGH', 'CRITICAL'] as const;
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: packet.timestamp,
        severity: severities[Math.floor(Math.random() * severities.length)],
        type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
        sourceIP: packet.sourceIP,
        destIP: packet.destIP,
        description: this.generateThreatDescription(packet),
        confidence: Math.floor(Math.random() * 40) + 60,
        blocked: Math.random() > 0.3,
        resolved: false
      };
    }

    return null;
  }

  private generateThreatDescription(packet: NetworkPacket): string {
    const descriptions = [
      `Suspicious ${packet.protocol} traffic from ${packet.sourceIP}`,
      `Potential port scan detected on port ${packet.destPort}`,
      `Anomalous packet size (${packet.size} bytes) detected`,
      `Brute force attempt detected from ${packet.sourceIP}`,
      `Malware signature matched in network traffic`,
      `DDoS pattern identified in packet flow`
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateMetrics(): SystemMetrics {
    return {
      cpuUsage: Math.floor(Math.random() * 30) + 20,
      memoryUsage: Math.floor(Math.random() * 40) + 30,
      networkIn: Math.floor(Math.random() * 1000) + 500,
      networkOut: Math.floor(Math.random() * 800) + 300,
      activeConnections: Math.floor(Math.random() * 200) + 50,
      threatsBlocked: this.alerts.filter(a => a.blocked).length,
      timestamp: Date.now()
    };
  }

  private generateRealTimeData() {
    setInterval(() => {
      if (this.isScanning) {
        // Generate 2-5 packets per second
        const packetCount = Math.floor(Math.random() * 4) + 2;
        
        for (let i = 0; i < packetCount; i++) {
          const packet = this.generatePacket();
          this.packets.unshift(packet);
          
          // Analyze for threats
          const threat = this.analyzePacketForThreats(packet);
          if (threat) {
            this.alerts.unshift(threat);
            this.notifyListeners({ type: 'threat', data: threat });
          }
        }

        // Keep only last 1000 packets
        this.packets = this.packets.slice(0, 1000);
        this.alerts = this.alerts.slice(0, 500);

        // Generate system metrics
        const metrics = this.generateMetrics();
        this.metrics.unshift(metrics);
        this.metrics = this.metrics.slice(0, 100);

        this.notifyListeners({ type: 'metrics', data: metrics });
        this.notifyListeners({ type: 'packets', data: this.packets.slice(0, 50) });
      }
    }, 200);
  }

  startScanning() {
    this.isScanning = true;
  }

  stopScanning() {
    this.isScanning = false;
  }

  getRecentPackets(limit = 100): NetworkPacket[] {
    return this.packets.slice(0, limit);
  }

  getActiveThreats(): ThreatAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  getAllThreats(): ThreatAlert[] {
    return this.alerts;
  }

  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics[0] || null;
  }

  getMetricsHistory(limit = 50): SystemMetrics[] {
    return this.metrics.slice(0, limit);
  }

  getMLModels(): MLModel[] {
    return this.models;
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);
  }

  unsubscribe(callback: (data: any) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => listener(data));
  }
}

export const securityEngine = SecurityEngine.getInstance();