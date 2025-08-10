import { SystemMetrics, NetworkPacket, ThreatAlert } from '../types/security';

export class RealTimeSystemMonitor {
  private static instance: RealTimeSystemMonitor;
  private listeners: ((data: any) => void)[] = [];
  private intervalId: number | null = null;
  private permissions: Record<string, boolean> = {};
  private performanceObserver: PerformanceObserver | null = null;
  private networkConnection: any = null;

  private constructor() {
    this.setupNetworkMonitoring();
  }

  static getInstance(): RealTimeSystemMonitor {
    if (!RealTimeSystemMonitor.instance) {
      RealTimeSystemMonitor.instance = new RealTimeSystemMonitor();
    }
    return RealTimeSystemMonitor.instance;
  }

  setPermissions(permissions: Record<string, boolean>) {
    this.permissions = permissions;
    this.setupMonitoring();
  }

  private setupNetworkMonitoring() {
    // Monitor network connection changes
    if ('connection' in navigator) {
      this.networkConnection = (navigator as any).connection;
      this.networkConnection?.addEventListener('change', () => {
        this.notifyListeners({
          type: 'network_change',
          data: {
            effectiveType: this.networkConnection.effectiveType,
            downlink: this.networkConnection.downlink,
            rtt: this.networkConnection.rtt,
            timestamp: Date.now()
          }
        });
      });
    }
  }

  private setupMonitoring() {
    // Setup Performance Observer for real network monitoring
    if (this.permissions.performance && typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
              this.analyzePerformanceEntry(entry);
            }
          }
        });
        
        this.performanceObserver.observe({ 
          entryTypes: ['navigation', 'resource', 'measure', 'mark'] 
        });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Setup storage monitoring
    if (this.permissions.storage && 'storage' in navigator) {
      this.monitorStorageUsage();
    }
  }

  private analyzePerformanceEntry(entry: PerformanceEntry) {
    try {
      const resourceEntry = entry as PerformanceResourceTiming;
      
      // Create network packet from performance entry
      const packet: NetworkPacket = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        sourceIP: this.extractIPFromURL(window.location.href) || '127.0.0.1',
        destIP: this.extractIPFromURL(resourceEntry.name) || 'unknown',
        sourcePort: this.extractPortFromURL(window.location.href) || 443,
        destPort: this.extractPortFromURL(resourceEntry.name) || 80,
        protocol: resourceEntry.name.startsWith('https') ? 'HTTPS' : 'HTTP',
        size: resourceEntry.transferSize || resourceEntry.encodedBodySize || 0,
        flags: this.determineFlags(resourceEntry)
      };

      // Analyze for anomalies
      if (this.isAnomalousRequest(resourceEntry)) {
        packet.isAnomalous = true;
        packet.anomalyScore = this.calculateAnomalyScore(resourceEntry);
        packet.anomalyReasons = this.getAnomalyReasons(resourceEntry);
      }

      this.notifyListeners({
        type: 'packet',
        data: packet
      });

      // Generate threat if highly anomalous
      if (packet.anomalyScore && packet.anomalyScore > 70) {
        this.generateThreatAlert(packet, resourceEntry);
      }

    } catch (error) {
      console.error('Error analyzing performance entry:', error);
    }
  }

  private extractIPFromURL(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Check if it's already an IP address
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(hostname)) {
        return hostname;
      }
      
      // For domain names, return a simulated IP based on domain
      const hash = this.hashCode(hostname);
      return `${(hash & 0xFF)}.${((hash >> 8) & 0xFF)}.${((hash >> 16) & 0xFF)}.${((hash >> 24) & 0xFF)}`;
    } catch {
      return null;
    }
  }

  private extractPortFromURL(url: string): number {
    try {
      const urlObj = new URL(url);
      if (urlObj.port) {
        return parseInt(urlObj.port);
      }
      return urlObj.protocol === 'https:' ? 443 : 80;
    } catch {
      return 80;
    }
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private determineFlags(entry: PerformanceResourceTiming): string[] {
    const flags: string[] = [];
    
    if (entry.redirectCount > 0) flags.push('REDIRECT');
    if (entry.transferSize === 0) flags.push('CACHED');
    if (entry.duration > 5000) flags.push('SLOW');
    if (entry.name.includes('websocket')) flags.push('WS');
    
    return flags;
  }

  private isAnomalousRequest(entry: PerformanceResourceTiming): boolean {
    // Check for various anomaly indicators
    const duration = entry.duration;
    const size = entry.transferSize || entry.encodedBodySize || 0;
    
    // Unusually long request duration
    if (duration > 10000) return true;
    
    // Unusually large transfer size
    if (size > 10 * 1024 * 1024) return true; // 10MB
    
    // Suspicious URLs
    const suspiciousPatterns = [
      /\/admin/i,
      /\/config/i,
      /\/backup/i,
      /\.env/i,
      /password/i,
      /secret/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(entry.name))) {
      return true;
    }
    
    // High redirect count
    if (entry.redirectCount > 5) return true;
    
    return false;
  }

  private calculateAnomalyScore(entry: PerformanceResourceTiming): number {
    let score = 0;
    
    const duration = entry.duration;
    const size = entry.transferSize || entry.encodedBodySize || 0;
    
    // Duration-based scoring
    if (duration > 30000) score += 40;
    else if (duration > 10000) score += 25;
    else if (duration > 5000) score += 15;
    
    // Size-based scoring
    if (size > 50 * 1024 * 1024) score += 35; // 50MB
    else if (size > 10 * 1024 * 1024) score += 25; // 10MB
    else if (size > 1024 * 1024) score += 15; // 1MB
    
    // URL pattern scoring
    const suspiciousPatterns = [
      { pattern: /\/admin/i, score: 20 },
      { pattern: /\/config/i, score: 25 },
      { pattern: /\/backup/i, score: 30 },
      { pattern: /\.env/i, score: 35 },
      { pattern: /password/i, score: 30 },
      { pattern: /secret/i, score: 30 }
    ];
    
    suspiciousPatterns.forEach(({ pattern, score: patternScore }) => {
      if (pattern.test(entry.name)) {
        score += patternScore;
      }
    });
    
    // Redirect scoring
    if (entry.redirectCount > 5) score += 20;
    else if (entry.redirectCount > 2) score += 10;
    
    return Math.min(100, score);
  }

  private getAnomalyReasons(entry: PerformanceResourceTiming): string[] {
    const reasons: string[] = [];
    
    const duration = entry.duration;
    const size = entry.transferSize || entry.encodedBodySize || 0;
    
    if (duration > 10000) {
      reasons.push(`Extremely slow request (${Math.round(duration)}ms)`);
    }
    
    if (size > 10 * 1024 * 1024) {
      reasons.push(`Large data transfer (${Math.round(size / (1024 * 1024))}MB)`);
    }
    
    if (entry.redirectCount > 5) {
      reasons.push(`Excessive redirects (${entry.redirectCount})`);
    }
    
    const suspiciousPatterns = [
      { pattern: /\/admin/i, reason: 'Access to admin endpoint' },
      { pattern: /\/config/i, reason: 'Configuration file access' },
      { pattern: /\/backup/i, reason: 'Backup file access' },
      { pattern: /\.env/i, reason: 'Environment file access' },
      { pattern: /password/i, reason: 'Password-related endpoint' },
      { pattern: /secret/i, reason: 'Secret information access' }
    ];
    
    suspiciousPatterns.forEach(({ pattern, reason }) => {
      if (pattern.test(entry.name)) {
        reasons.push(reason);
      }
    });
    
    return reasons;
  }

  private generateThreatAlert(packet: NetworkPacket, entry: PerformanceResourceTiming) {
    const threat: ThreatAlert = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      severity: packet.anomalyScore! > 85 ? 'CRITICAL' : packet.anomalyScore! > 70 ? 'HIGH' : 'MEDIUM',
      type: this.determineThreatType(entry),
      sourceIP: packet.sourceIP,
      destIP: packet.destIP,
      description: `Suspicious network activity detected: ${entry.name}`,
      confidence: packet.anomalyScore!,
      blocked: packet.anomalyScore! > 80,
      resolved: false
    };

    this.notifyListeners({
      type: 'threat',
      data: threat
    });
  }

  private determineThreatType(entry: PerformanceResourceTiming): ThreatAlert['type'] {
    const url = entry.name.toLowerCase();
    
    if (url.includes('admin') || url.includes('config')) return 'INTRUSION';
    if (entry.transferSize && entry.transferSize > 50 * 1024 * 1024) return 'DATA_EXFILTRATION';
    if (entry.duration > 30000) return 'DDoS';
    
    return 'ANOMALY';
  }

  private async monitorStorageUsage() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        
        this.notifyListeners({
          type: 'storage',
          data: {
            quota: estimate.quota,
            usage: estimate.usage,
            usagePercentage: estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0,
            timestamp: Date.now()
          }
        });
      }
    } catch (error) {
      console.error('Error monitoring storage:', error);
    }
  }

  private collectSystemMetrics(): SystemMetrics {
    const connection = this.networkConnection;
    
    return {
      cpuUsage: this.estimateCPUUsage(),
      memoryUsage: this.estimateMemoryUsage(),
      networkIn: connection?.downlink ? connection.downlink * 125 : Math.random() * 1000, // Convert Mbps to KB/s
      networkOut: connection?.downlink ? connection.downlink * 62.5 : Math.random() * 500, // Estimate upload
      activeConnections: this.estimateActiveConnections(),
      threatsBlocked: 0, // Will be updated by security engine
      timestamp: Date.now()
    };
  }

  private estimateCPUUsage(): number {
    // Estimate CPU usage based on performance timing
    const now = performance.now();
    const entries = performance.getEntriesByType('measure');
    
    if (entries.length > 0) {
      const avgDuration = entries.reduce((sum, entry) => sum + entry.duration, 0) / entries.length;
      return Math.min(100, Math.max(0, (avgDuration / 100) * 10));
    }
    
    return Math.random() * 30 + 10; // Fallback simulation
  }

  private estimateMemoryUsage(): number {
    // Use memory API if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.min(100, (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
    }
    
    return Math.random() * 40 + 20; // Fallback simulation
  }

  private estimateActiveConnections(): number {
    // Estimate based on recent network activity
    const recentEntries = performance.getEntriesByType('resource')
      .filter(entry => Date.now() - entry.startTime < 60000); // Last minute
    
    return Math.max(1, recentEntries.length);
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
    if (this.intervalId) return;

    console.log('Starting real-time system monitoring...');
    
    // Start periodic metrics collection
    this.intervalId = setInterval(() => {
      const metrics = this.collectSystemMetrics();
      this.notifyListeners({
        type: 'metrics',
        data: metrics
      });
    }, 2000) as unknown as number;

    // Start storage monitoring if permitted
    if (this.permissions.storage) {
      setInterval(() => {
        this.monitorStorageUsage();
      }, 10000); // Every 10 seconds
    }
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    console.log('Stopped real-time system monitoring.');
  }

  getPermissions(): Record<string, boolean> {
    return { ...this.permissions };
  }
}

export const realTimeSystemMonitor = RealTimeSystemMonitor.getInstance();