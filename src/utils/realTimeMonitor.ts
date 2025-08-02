export class RealTimeMonitor {
  private static instance: RealTimeMonitor;
  private listeners: ((data: any) => void)[] = [];
  private intervalId: number | null = null;

  private constructor() {}

  static getInstance(): RealTimeMonitor {
    if (!RealTimeMonitor.instance) {
      RealTimeMonitor.instance = new RealTimeMonitor();
    }
    return RealTimeMonitor.instance;
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
        console.error('Error notifying listener:', error);
      }
    });
  }

  startMonitoring() {
    if (this.intervalId) {
      console.warn('Monitoring already active.');
      return;
    }

    console.log('Starting real-time monitoring...');
    this.intervalId = setInterval(() => {
      this.simulateData();
    }, 1000) as unknown as number; // Simulate data every second
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped real-time monitoring.');
    }
  }

  private simulateData() {
    // Simulate network packets
    if (Math.random() < 0.7) {
      this.notifyListeners({
        type: 'packet',
        data: {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          sourceIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
          destIP: `10.0.0.${Math.floor(Math.random() * 255)}`,
          sourcePort: Math.floor(Math.random() * 65535),
          destPort: Math.floor(Math.random() * 65535),
          protocol: ['TCP', 'UDP', 'HTTP', 'HTTPS', 'ICMP'][Math.floor(Math.random() * 5)],
          size: Math.floor(Math.random() * 1400) + 60,
          flags: ['SYN', 'ACK', 'FIN'].filter(() => Math.random() > 0.5)
        }
      });
    }

    // Simulate system metrics
    if (Math.random() < 0.5) {
      this.notifyListeners({
        type: 'metrics',
        data: {
          cpuUsage: Math.floor(Math.random() * 20) + 10,
          memoryUsage: Math.floor(Math.random() * 30) + 20,
          networkIn: Math.floor(Math.random() * 500) + 100,
          networkOut: Math.floor(Math.random() * 400) + 50,
          activeConnections: Math.floor(Math.random() * 100) + 20,
          threatsBlocked: Math.floor(Math.random() * 5),
          timestamp: Date.now()
        }
      });
    }

    // Simulate threats
    if (Math.random() < 0.1) {
      const threatTypes = ['MALWARE', 'INTRUSION', 'ANOMALY', 'BRUTE_FORCE', 'DDoS', 'DATA_EXFILTRATION'];
      const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      this.notifyListeners({
        type: 'threat',
        data: {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          severity: severities[Math.floor(Math.random() * severities.length)],
          type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          sourceIP: `203.0.113.${Math.floor(Math.random() * 255)}`,
          description: 'Simulated threat detection.',
          confidence: Math.floor(Math.random() * 30) + 70,
          blocked: Math.random() > 0.5,
          resolved: false
        }
      });
    }

    // Simulate logs
    if (Math.random() < 0.3) {
      const levels = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];
      const sources = ['NETWORK', 'HOST', 'FILESYSTEM', 'PROCESS', 'SYSTEM'];
      this.notifyListeners({
        type: 'log',
        data: {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          level: levels[Math.floor(Math.random() * levels.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          message: 'Simulated system log entry.'
        }
      });
    }
  }
}

export const realTimeMonitor = RealTimeMonitor.getInstance();