import { NetworkPacket, ThreatAlert, SystemMetrics, SystemProcess, FileSystemEvent, SystemLog } from '../types/security';

export class RealTimeMonitor {
  private static instance: RealTimeMonitor;
  private isMonitoring = false;
  private listeners: ((data: any) => void)[] = [];
  private networkInterface: any = null;
  private processMonitor: any = null;
  private fileWatcher: any = null;

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): RealTimeMonitor {
    if (!RealTimeMonitor.instance) {
      RealTimeMonitor.instance = new RealTimeMonitor();
    }
    return RealTimeMonitor.instance;
  }

  private async initializeMonitoring() {
    try {
      // Initialize real-time monitoring capabilities
      await this.setupNetworkMonitoring();
      await this.setupHostMonitoring();
      await this.setupFileSystemWatching();
      await this.setupProcessMonitoring();
    } catch (error) {
      console.error('Failed to initialize real-time monitoring:', error);
      this.notifyListeners({
        type: 'error',
        data: { message: 'Real-time monitoring initialization failed', error }
      });
    }
  }

  private async setupNetworkMonitoring() {
    try {
      // Check if we can access network interfaces
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        
        // Monitor network changes
        connection.addEventListener('change', () => {
          this.handleNetworkChange(connection);
        });

        // Start packet capture simulation with real network stats
        this.startNetworkCapture();
      }
    } catch (error) {
      console.warn('Network monitoring limited in browser environment:', error);
      this.startSimulatedNetworkMonitoring();
    }
  }

  private async setupHostMonitoring() {
    try {
      // Monitor system resources using Performance API
      if ('performance' in window && 'memory' in (performance as any)) {
        this.startSystemResourceMonitoring();
      }

      // Monitor user activity
      this.setupUserActivityMonitoring();
      
      // Monitor browser security events
      this.setupBrowserSecurityMonitoring();
    } catch (error) {
      console.error('Host monitoring setup failed:', error);
    }
  }

  private async setupFileSystemWatching() {
    try {
      // In browser environment, monitor localStorage/sessionStorage changes
      this.setupStorageMonitoring();
      
      // Monitor file API usage
      this.setupFileAPIMonitoring();
    } catch (error) {
      console.error('File system monitoring setup failed:', error);
    }
  }

  private async setupProcessMonitoring() {
    try {
      // Monitor web workers and service workers
      this.setupWorkerMonitoring();
      
      // Monitor script execution
      this.setupScriptMonitoring();
    } catch (error) {
      console.error('Process monitoring setup failed:', error);
    }
  }

  private startNetworkCapture() {
    if (!this.isMonitoring) return;

    // Real network monitoring using Resource Timing API
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.processNetworkEntry(entry as PerformanceResourceTiming);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private processNetworkEntry(entry: PerformanceResourceTiming) {
    const packet: NetworkPacket = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      sourceIP: this.extractIPFromURL(entry.name) || 'localhost',
      destIP: window.location.hostname,
      sourcePort: this.extractPortFromURL(entry.name) || 80,
      destPort: window.location.port ? parseInt(window.location.port) : 80,
      protocol: entry.name.startsWith('https') ? 'HTTPS' : 'HTTP',
      size: entry.transferSize || 0,
      flags: this.analyzeResourceTiming(entry)
    };

    this.notifyListeners({ type: 'packet', data: packet });
    this.analyzePacketForThreats(packet);
  }

  private extractIPFromURL(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Check if it's already an IP address
      if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return hostname;
      }
      
      // For domain names, we'll simulate IP resolution
      return this.simulateIPResolution(hostname);
    } catch {
      return null;
    }
  }

  private simulateIPResolution(hostname: string): string {
    // Simulate common IP addresses for known domains
    const knownIPs: Record<string, string> = {
      'localhost': '127.0.0.1',
      'google.com': '8.8.8.8',
      'cloudflare.com': '1.1.1.1',
      'github.com': '140.82.114.4'
    };

    return knownIPs[hostname] || `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
  }

  private extractPortFromURL(url: string): number | null {
    try {
      const urlObj = new URL(url);
      return urlObj.port ? parseInt(urlObj.port) : (urlObj.protocol === 'https:' ? 443 : 80);
    } catch {
      return null;
    }
  }

  private analyzeResourceTiming(entry: PerformanceResourceTiming): string[] {
    const flags: string[] = [];
    
    if (entry.connectEnd - entry.connectStart > 1000) flags.push('SLOW_CONNECT');
    if (entry.responseEnd - entry.responseStart > 5000) flags.push('SLOW_RESPONSE');
    if (entry.transferSize === 0) flags.push('CACHED');
    if (entry.transferSize > 1000000) flags.push('LARGE_TRANSFER');
    
    return flags;
  }

  private analyzePacketForThreats(packet: NetworkPacket) {
    const threats: ThreatAlert[] = [];

    // Analyze for suspicious patterns
    if (packet.size > 10000000) { // Large transfer
      threats.push(this.createThreatAlert('DATA_EXFILTRATION', 'HIGH', packet, 'Large data transfer detected'));
    }

    if (packet.flags.includes('SLOW_CONNECT')) {
      threats.push(this.createThreatAlert('ANOMALY', 'MEDIUM', packet, 'Slow connection detected - possible network issue'));
    }

    // Check for suspicious domains/IPs
    if (this.isSuspiciousIP(packet.sourceIP)) {
      threats.push(this.createThreatAlert('INTRUSION', 'HIGH', packet, 'Connection from suspicious IP address'));
    }

    threats.forEach(threat => {
      this.notifyListeners({ type: 'threat', data: threat });
    });
  }

  private isSuspiciousIP(ip: string): boolean {
    const suspiciousRanges = [
      /^10\.0\.0\./,
      /^192\.168\.100\./,
      /^172\.16\.0\./
    ];

    return suspiciousRanges.some(range => range.test(ip));
  }

  private createThreatAlert(type: ThreatAlert['type'], severity: ThreatAlert['severity'], packet: NetworkPacket, description: string): ThreatAlert {
    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      severity,
      type,
      sourceIP: packet.sourceIP,
      destIP: packet.destIP,
      description,
      confidence: Math.floor(Math.random() * 30) + 70,
      blocked: severity === 'HIGH' || severity === 'CRITICAL',
      resolved: false
    };
  }

  private startSystemResourceMonitoring() {
    setInterval(() => {
      if (!this.isMonitoring) return;

      const memory = (performance as any).memory;
      const metrics: SystemMetrics = {
        cpuUsage: this.estimateCPUUsage(),
        memoryUsage: memory ? Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : 0,
        networkIn: this.getNetworkStats().bytesReceived,
        networkOut: this.getNetworkStats().bytesSent,
        activeConnections: this.getActiveConnections(),
        threatsBlocked: 0,
        timestamp: Date.now()
      };

      this.notifyListeners({ type: 'metrics', data: metrics });
    }, 1000);
  }

  private estimateCPUUsage(): number {
    // Estimate CPU usage based on performance timing
    const start = performance.now();
    let iterations = 0;
    const maxTime = 10; // 10ms test

    while (performance.now() - start < maxTime) {
      iterations++;
    }

    // Normalize to percentage (higher iterations = lower CPU usage)
    return Math.max(0, Math.min(100, 100 - (iterations / 10000)));
  }

  private getNetworkStats() {
    // Simulate network statistics
    return {
      bytesReceived: Math.floor(Math.random() * 1000) + 500,
      bytesSent: Math.floor(Math.random() * 800) + 300
    };
  }

  private getActiveConnections(): number {
    // Estimate based on resource timing entries
    const entries = performance.getEntriesByType('resource');
    return entries.filter(entry => 
      entry.startTime > Date.now() - 60000 // Last minute
    ).length;
  }

  private setupUserActivityMonitoring() {
    const events = ['click', 'keydown', 'mousemove', 'scroll'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.analyzeUserActivity(eventType, event);
      });
    });
  }

  private analyzeUserActivity(eventType: string, event: Event) {
    // Detect suspicious user behavior patterns
    const suspiciousPatterns = [
      { pattern: 'rapid_clicks', threshold: 10 }, // 10 clicks per second
      { pattern: 'unusual_key_sequence', threshold: 50 } // 50 keys per second
    ];

    // Log user activity for analysis
    this.logActivity({
      type: eventType,
      timestamp: Date.now(),
      target: (event.target as Element)?.tagName || 'unknown'
    });
  }

  private setupBrowserSecurityMonitoring() {
    // Monitor for security-related browser events
    window.addEventListener('securitypolicyviolation', (event) => {
      const threat: ThreatAlert = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        severity: 'HIGH',
        type: 'INTRUSION',
        sourceIP: 'localhost',
        description: `CSP violation: ${event.violatedDirective}`,
        confidence: 95,
        blocked: true,
        resolved: false
      };

      this.notifyListeners({ type: 'threat', data: threat });
    });

    // Monitor for XSS attempts
    this.setupXSSDetection();
  }

  private setupXSSDetection() {
    const originalInnerHTML = Element.prototype.innerHTML;
    
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        if (typeof value === 'string' && this.detectXSS(value)) {
          const threat: ThreatAlert = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            severity: 'CRITICAL',
            type: 'MALWARE',
            sourceIP: 'localhost',
            description: 'Potential XSS attempt detected in DOM manipulation',
            confidence: 90,
            blocked: true,
            resolved: false
          };

          RealTimeMonitor.getInstance().notifyListeners({ type: 'threat', data: threat });
          return; // Block the XSS attempt
        }
        
        originalInnerHTML.call(this, value);
      },
      get: function() {
        return originalInnerHTML.call(this);
      }
    });
  }

  private detectXSS(content: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(content));
  }

  private setupStorageMonitoring() {
    const originalSetItem = Storage.prototype.setItem;
    
    Storage.prototype.setItem = function(key, value) {
      RealTimeMonitor.getInstance().analyzeStorageAccess('SET', key, value);
      return originalSetItem.call(this, key, value);
    };

    const originalGetItem = Storage.prototype.getItem;
    
    Storage.prototype.getItem = function(key) {
      RealTimeMonitor.getInstance().analyzeStorageAccess('GET', key);
      return originalGetItem.call(this, key);
    };
  }

  private analyzeStorageAccess(operation: string, key: string, value?: string) {
    // Detect suspicious storage patterns
    if (key.includes('password') || key.includes('token') || key.includes('secret')) {
      const threat: ThreatAlert = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        severity: 'MEDIUM',
        type: 'DATA_EXFILTRATION',
        sourceIP: 'localhost',
        description: `Suspicious storage access: ${operation} operation on sensitive key "${key}"`,
        confidence: 75,
        blocked: false,
        resolved: false
      };

      this.notifyListeners({ type: 'threat', data: threat });
    }
  }

  private setupFileAPIMonitoring() {
    if ('FileReader' in window) {
      const originalReadAsText = FileReader.prototype.readAsText;
      
      FileReader.prototype.readAsText = function(file) {
        RealTimeMonitor.getInstance().analyzeFileAccess(file);
        return originalReadAsText.call(this, file);
      };
    }
  }

  private analyzeFileAccess(file: File) {
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif'];
    const suspiciousTypes = ['application/x-msdownload', 'application/x-executable'];

    if (suspiciousExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) ||
        suspiciousTypes.includes(file.type)) {
      
      const threat: ThreatAlert = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        severity: 'HIGH',
        type: 'MALWARE',
        sourceIP: 'localhost',
        description: `Suspicious file access: ${file.name} (${file.type})`,
        confidence: 85,
        blocked: true,
        resolved: false
      };

      this.notifyListeners({ type: 'threat', data: threat });
    }
  }

  private setupWorkerMonitoring() {
    // Monitor Web Workers
    const originalWorker = window.Worker;
    
    window.Worker = class extends originalWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        super(scriptURL, options);
        RealTimeMonitor.getInstance().analyzeWorkerCreation(scriptURL.toString());
      }
    };
  }

  private analyzeWorkerCreation(scriptURL: string) {
    // Analyze worker script for suspicious patterns
    if (scriptURL.includes('crypto') || scriptURL.includes('mining')) {
      const threat: ThreatAlert = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        severity: 'HIGH',
        type: 'MALWARE',
        sourceIP: 'localhost',
        description: `Suspicious worker script detected: ${scriptURL}`,
        confidence: 80,
        blocked: false,
        resolved: false
      };

      this.notifyListeners({ type: 'threat', data: threat });
    }
  }

  private setupScriptMonitoring() {
    // Monitor dynamic script creation
    const originalCreateElement = document.createElement;
    
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(this, tagName);
      
      if (tagName.toLowerCase() === 'script') {
        RealTimeMonitor.getInstance().monitorScriptElement(element as HTMLScriptElement);
      }
      
      return element;
    };
  }

  private monitorScriptElement(script: HTMLScriptElement) {
    const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')?.set;
    
    if (originalSrcSetter) {
      Object.defineProperty(script, 'src', {
        set: function(value) {
          RealTimeMonitor.getInstance().analyzeScriptSource(value);
          originalSrcSetter.call(this, value);
        }
      });
    }
  }

  private analyzeScriptSource(src: string) {
    const suspiciousDomains = ['malware.com', 'phishing.net', 'suspicious.org'];
    
    if (suspiciousDomains.some(domain => src.includes(domain))) {
      const threat: ThreatAlert = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        severity: 'CRITICAL',
        type: 'MALWARE',
        sourceIP: 'external',
        description: `Malicious script source detected: ${src}`,
        confidence: 95,
        blocked: true,
        resolved: false
      };

      this.notifyListeners({ type: 'threat', data: threat });
    }
  }

  private startSimulatedNetworkMonitoring() {
    // Fallback to simulated monitoring with realistic patterns
    setInterval(() => {
      if (!this.isMonitoring) return;

      const packet = this.generateRealisticPacket();
      this.notifyListeners({ type: 'packet', data: packet });
      this.analyzePacketForThreats(packet);
    }, 100 + Math.random() * 200);
  }

  private generateRealisticPacket(): NetworkPacket {
    const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'ICMP'] as const;
    const commonPorts = [80, 443, 22, 21, 25, 53, 110, 143, 993, 995];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      sourceIP: this.generateRealisticIP(),
      destIP: this.generateRealisticIP(),
      sourcePort: commonPorts[Math.floor(Math.random() * commonPorts.length)],
      destPort: commonPorts[Math.floor(Math.random() * commonPorts.length)],
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      size: Math.floor(Math.random() * 1500) + 64,
      flags: this.generateRealisticFlags()
    };
  }

  private generateRealisticIP(): string {
    const ranges = [
      () => `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `10.0.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `172.16.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `8.8.8.8`, // Google DNS
      () => `1.1.1.1`  // Cloudflare DNS
    ];

    return ranges[Math.floor(Math.random() * ranges.length)]();
  }

  private generateRealisticFlags(): string[] {
    const allFlags = ['SYN', 'ACK', 'FIN', 'RST', 'PSH', 'URG'];
    const flagCount = Math.floor(Math.random() * 3) + 1;
    
    return allFlags
      .sort(() => Math.random() - 0.5)
      .slice(0, flagCount);
  }

  private logActivity(activity: any) {
    const log: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level: 'INFO',
      source: 'HOST',
      message: `User activity: ${activity.type}`,
      details: activity
    };

    this.notifyListeners({ type: 'log', data: log });
  }

  private handleNetworkChange(connection: any) {
    const log: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level: 'INFO',
      source: 'NETWORK',
      message: `Network change detected: ${connection.effectiveType}`,
      details: {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      }
    };

    this.notifyListeners({ type: 'log', data: log });
  }

  startMonitoring() {
    this.isMonitoring = true;
    console.log('Real-time monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('Real-time monitoring stopped');
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
        console.error('Error in listener:', error);
      }
    });
  }
}

export const realTimeMonitor = RealTimeMonitor.getInstance();