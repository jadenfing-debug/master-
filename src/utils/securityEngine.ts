import { NetworkPacket, ThreatAlert, SystemMetrics, MLModel } from '../types/security';
import { realTimeMonitor } from './realTimeMonitor';
import { realTimeSystemMonitor } from './realTimeSystemMonitor';
import { anomalyDetector } from './anomalyDetector';

export class SecurityEngine {
  private static instance: SecurityEngine;
  private packets: NetworkPacket[] = [];
  private alerts: ThreatAlert[] = [];
  private metrics: SystemMetrics[] = [];
  private models: MLModel[] = [];
  private logs: any[] = [];
  private isScanning = false;
  private listeners: ((data: any) => void)[] = [];
  private errorHandler: ((error: Error) => void) | null = null;

  private constructor() {
    this.initializeMLModels();
    this.setupErrorHandling();
    this.integrateRealTimeMonitor();
    this.integrateSystemMonitor();
  }

  static getInstance(): SecurityEngine {
    if (!SecurityEngine.instance) {
      SecurityEngine.instance = new SecurityEngine();
    }
    return SecurityEngine.instance;
  }

  private setupErrorHandling() {
    this.errorHandler = (error: Error) => {
      console.error('SecurityEngine Error:', error);
      this.notifyListeners({
        type: 'error',
        data: {
          message: error.message,
          timestamp: Date.now(),
          stack: error.stack
        }
      });
    };

    // Global error handling
    window.addEventListener('error', (event) => {
      this.errorHandler?.(new Error(event.message));
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.errorHandler?.(new Error(event.reason));
    });
  }

  private integrateRealTimeMonitor() {
    try {
      realTimeMonitor.subscribe((data) => {
        this.handleRealTimeData(data);
      });
    } catch (error) {
      this.errorHandler?.(error as Error);
    }
  }

  private integrateSystemMonitor() {
    try {
      realTimeSystemMonitor.subscribe((data) => {
        this.handleRealTimeData(data);
      });
    } catch (error) {
      this.errorHandler?.(error as Error);
    }
  }

  private handleRealTimeData(data: any) {
    try {
      if (!data || !data.type) return;
      
      switch (data.type) {
        case 'packet':
          if (data.data) {
            // Analyze packet for anomalies
            const anomalyAnalysis = anomalyDetector.analyzePacket(data.data);
            data.data.anomalyScore = anomalyAnalysis.score;
            data.data.anomalyReasons = anomalyAnalysis.factors.map(f => f.description);
            data.data.isAnomalous = anomalyAnalysis.verdict !== 'NORMAL';
            
            this.packets.unshift(data.data);
            this.packets = this.packets.slice(0, 1000);
            this.notifyListeners({ type: 'packets', data: this.packets.slice(0, 50) });
            
            // Generate threat alert if anomalous
            if (anomalyAnalysis.verdict === 'ANOMALOUS' || anomalyAnalysis.verdict === 'MALICIOUS') {
              const threat = this.createThreatFromAnomaly(data.data, anomalyAnalysis);
              this.alerts.unshift(threat);
              this.alerts = this.alerts.slice(0, 500);
              this.notifyListeners({ type: 'threat', data: threat });
            }
          }
          break;
        case 'threat':
          if (data.data) {
            this.alerts.unshift(data.data);
            this.alerts = this.alerts.slice(0, 500);
            this.notifyListeners({ type: 'threat', data: data.data });
          }
          break;
        case 'metrics':
          if (data.data) {
            this.metrics.unshift(data.data);
            this.metrics = this.metrics.slice(0, 100);
            this.notifyListeners({ type: 'metrics', data: data.data });
            
            // Update anomaly detector baseline periodically
            if (this.packets.length > 0 && this.packets.length % 100 === 0) {
              anomalyDetector.updateBaseline(this.packets.slice(0, 500));
            }
          }
          break;
        case 'log':
          if (data.data) {
            this.logs.unshift(data.data);
            this.logs = this.logs.slice(0, 1000);
            this.notifyListeners({ type: 'log', data: data.data });
          }
          break;
        case 'network_change':
          if (data.data) {
            this.notifyListeners({ type: 'network_change', data: data.data });
          }
          break;
        case 'storage':
          if (data.data) {
            this.notifyListeners({ type: 'storage', data: data.data });
          }
          break;
        case 'error':
          if (data.data) {
            this.notifyListeners({ type: 'error', data: data.data });
          }
          break;
      }
    } catch (error) {
      this.errorHandler?.(error as Error);
    }
  }

  private createThreatFromAnomaly(packet: NetworkPacket, analysis: any): ThreatAlert {
    const severityMap = {
      'MALICIOUS': 'CRITICAL' as const,
      'ANOMALOUS': 'HIGH' as const,
      'SUSPICIOUS': 'MEDIUM' as const,
      'NORMAL': 'LOW' as const
    };

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: packet.timestamp,
      severity: severityMap[analysis.verdict] || 'MEDIUM',
      type: 'ANOMALY',
      sourceIP: packet.sourceIP,
      destIP: packet.destIP,
      description: analysis.explanation,
      confidence: analysis.score,
      blocked: analysis.score > 70,
      resolved: false,
      anomalyAnalysis: analysis
    };
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

  startScanning() {
    try {
      this.isScanning = true;
      realTimeMonitor.startMonitoring();
      realTimeSystemMonitor.startMonitoring();
      this.notifyListeners({ 
        type: 'status', 
        data: { scanning: true, message: 'Real-time monitoring started' } 
      });
    } catch (error) {
      this.errorHandler?.(error as Error);
    }
  }

  stopScanning() {
    try {
      this.isScanning = false;
      realTimeMonitor.stopMonitoring();
      realTimeSystemMonitor.stopMonitoring();
      this.notifyListeners({ 
        type: 'status', 
        data: { scanning: false, message: 'Real-time monitoring stopped' } 
      });
    } catch (error) {
      this.errorHandler?.(error as Error);
    }
  }

  setSystemPermissions(permissions: Record<string, boolean>) {
    realTimeSystemMonitor.setPermissions(permissions);
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

  getLogs(): any[] {
    return this.logs;
  }

  resolveAlert(alertId: string) {
    try {
      if (!alertId) return;
      
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
      }
    } catch (error) {
      this.errorHandler?.(error as Error);
    }
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);
  }

  unsubscribe(callback: (data: any) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        this.errorHandler?.(error as Error);
      }
    });
  }

  // Health check method
  getSystemHealth() {
    return {
      isScanning: this.isScanning,
      packetsCount: this.packets.length,
      threatsCount: this.alerts.length,
      metricsCount: this.metrics.length,
      logsCount: this.logs.length,
      modelsActive: this.models.filter(m => m.status === 'ACTIVE').length,
      lastUpdate: Date.now()
    };
  }

  // Performance optimization
  cleanup() {
    try {
      // Clean up old data to prevent memory leaks
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const cutoff = Date.now() - maxAge;

      this.packets = this.packets.filter(p => p && p.timestamp > cutoff);
      this.alerts = this.alerts.filter(a => a && a.timestamp > cutoff);
      this.metrics = this.metrics.filter(m => m && m.timestamp > cutoff);
      this.logs = this.logs.filter(l => l && l.timestamp > cutoff);
    } catch (error) {
      this.errorHandler?.(error as Error);
    }
  }

  // Get anomaly detector statistics
  getAnomalyStatistics() {
    return anomalyDetector.getStatistics();
  }

  // Get current baseline metrics
  getBaselineMetrics() {
    return anomalyDetector.getBaseline();
  }
}

export const securityEngine = SecurityEngine.getInstance();