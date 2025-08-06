import { NetworkPacket, ThreatAlert, AnomalyAnalysis, AnomalyFactor, BaselineMetrics } from '../types/security';

export class AnomalyDetector {
  private static instance: AnomalyDetector;
  private baseline: BaselineMetrics;
  private packetHistory: NetworkPacket[] = [];
  private connectionPatterns: Map<string, number> = new Map();
  private protocolStats: Map<string, number> = new Map();
  private portStats: Map<number, number> = new Map();

  private constructor() {
    this.baseline = this.initializeBaseline();
  }

  static getInstance(): AnomalyDetector {
    if (!AnomalyDetector.instance) {
      AnomalyDetector.instance = new AnomalyDetector();
    }
    return AnomalyDetector.instance;
  }

  private initializeBaseline(): BaselineMetrics {
    return {
      avgPacketSize: 512,
      commonPorts: [80, 443, 22, 21, 25, 53, 110, 143, 993, 995],
      typicalProtocols: ['TCP', 'UDP', 'HTTP', 'HTTPS'],
      normalFrequency: 10, // packets per second
      establishedConnections: ['192.168.1.1', '8.8.8.8', '1.1.1.1']
    };
  }

  analyzePacket(packet: NetworkPacket): AnomalyAnalysis {
    const factors: AnomalyFactor[] = [];
    
    // Update packet history
    this.packetHistory.unshift(packet);
    this.packetHistory = this.packetHistory.slice(0, 1000);
    
    // Update statistics
    this.updateStatistics(packet);

    // Analyze different factors
    factors.push(...this.analyzePacketSize(packet));
    factors.push(...this.analyzeFrequency(packet));
    factors.push(...this.analyzeProtocol(packet));
    factors.push(...this.analyzePorts(packet));
    factors.push(...this.analyzeTiming(packet));
    factors.push(...this.analyzeGeolocation(packet));
    factors.push(...this.analyzeBehavior(packet));
    factors.push(...this.analyzeSignatures(packet));

    // Calculate overall anomaly score
    const score = this.calculateAnomalyScore(factors);
    const verdict = this.determineVerdict(score);
    const explanation = this.generateExplanation(factors, score, verdict);

    return {
      score,
      factors,
      baseline: this.baseline,
      verdict,
      explanation
    };
  }

  private updateStatistics(packet: NetworkPacket) {
    // Update connection patterns
    const connectionKey = `${packet.sourceIP}:${packet.destIP}`;
    this.connectionPatterns.set(connectionKey, (this.connectionPatterns.get(connectionKey) || 0) + 1);

    // Update protocol stats
    this.protocolStats.set(packet.protocol, (this.protocolStats.get(packet.protocol) || 0) + 1);

    // Update port stats
    this.portStats.set(packet.destPort, (this.portStats.get(packet.destPort) || 0) + 1);
  }

  private analyzePacketSize(packet: NetworkPacket): AnomalyFactor[] {
    const factors: AnomalyFactor[] = [];
    const sizeDeviation = Math.abs(packet.size - this.baseline.avgPacketSize) / this.baseline.avgPacketSize;

    if (sizeDeviation > 2.0) { // More than 200% deviation
      factors.push({
        type: 'SIZE',
        description: 'Unusual packet size detected',
        score: Math.min(sizeDeviation * 30, 100),
        weight: 0.2,
        evidence: `Packet size: ${packet.size}B, Expected: ~${this.baseline.avgPacketSize}B (${Math.round(sizeDeviation * 100)}% deviation)`
      });
    }

    // Check for extremely large packets (potential data exfiltration)
    if (packet.size > 10000) {
      factors.push({
        type: 'SIZE',
        description: 'Extremely large packet detected',
        score: 85,
        weight: 0.3,
        evidence: `Packet size: ${packet.size}B exceeds normal threshold (10KB)`
      });
    }

    // Check for suspiciously small packets
    if (packet.size < 20 && packet.protocol !== 'ICMP') {
      factors.push({
        type: 'SIZE',
        description: 'Suspiciously small packet',
        score: 60,
        weight: 0.15,
        evidence: `Packet size: ${packet.size}B is unusually small for ${packet.protocol}`
      });
    }

    return factors;
  }

  private analyzeFrequency(packet: NetworkPacket): AnomalyFactor[] {
    const factors: AnomalyFactor[] = [];
    const recentPackets = this.packetHistory.filter(p => 
      Date.now() - p.timestamp < 10000 && p.sourceIP === packet.sourceIP
    );

    const frequency = recentPackets.length / 10; // packets per second

    if (frequency > this.baseline.normalFrequency * 5) {
      factors.push({
        type: 'FREQUENCY',
        description: 'High frequency traffic from source',
        score: Math.min((frequency / this.baseline.normalFrequency) * 20, 100),
        weight: 0.25,
        evidence: `${frequency.toFixed(1)} packets/sec from ${packet.sourceIP} (normal: ${this.baseline.normalFrequency}/sec)`
      });
    }

    // Check for burst patterns (potential DDoS)
    const burstWindow = this.packetHistory.filter(p => 
      Date.now() - p.timestamp < 1000 && p.sourceIP === packet.sourceIP
    );

    if (burstWindow.length > 50) {
      factors.push({
        type: 'FREQUENCY',
        description: 'Traffic burst detected',
        score: 90,
        weight: 0.3,
        evidence: `${burstWindow.length} packets in 1 second from ${packet.sourceIP}`
      });
    }

    return factors;
  }

  private analyzeProtocol(packet: NetworkPacket): AnomalyFactor[] {
    const factors: AnomalyFactor[] = [];

    if (!this.baseline.typicalProtocols.includes(packet.protocol)) {
      factors.push({
        type: 'PROTOCOL',
        description: 'Unusual protocol detected',
        score: 40,
        weight: 0.15,
        evidence: `Protocol ${packet.protocol} is not commonly used in this network`
      });
    }

    // Check for protocol anomalies
    if (packet.protocol === 'ICMP' && packet.size > 1000) {
      factors.push({
        type: 'PROTOCOL',
        description: 'Large ICMP packet (potential tunneling)',
        score: 75,
        weight: 0.25,
        evidence: `ICMP packet with ${packet.size}B payload (normal: <100B)`
      });
    }

    // Check for suspicious port/protocol combinations
    if (packet.protocol === 'UDP' && [22, 23, 80, 443].includes(packet.destPort)) {
      factors.push({
        type: 'PROTOCOL',
        description: 'Unusual protocol/port combination',
        score: 65,
        weight: 0.2,
        evidence: `UDP traffic to port ${packet.destPort} (typically TCP)`
      });
    }

    return factors;
  }

  private analyzePorts(packet: NetworkPacket): AnomalyFactor[] {
    const factors: AnomalyFactor[] = [];

    // Check for uncommon destination ports
    if (!this.baseline.commonPorts.includes(packet.destPort)) {
      const portUsage = this.portStats.get(packet.destPort) || 0;
      if (portUsage < 5) { // Rarely used port
        factors.push({
          type: 'PROTOCOL',
          description: 'Connection to uncommon port',
          score: 45,
          weight: 0.1,
          evidence: `Port ${packet.destPort} is rarely used (${portUsage} previous connections)`
        });
      }
    }

    // Check for high source ports (potential scanning)
    if (packet.sourcePort > 60000) {
      factors.push({
        type: 'BEHAVIOR',
        description: 'High source port number',
        score: 30,
        weight: 0.05,
        evidence: `Source port ${packet.sourcePort} indicates potential automated scanning`
      });
    }

    // Check for well-known vulnerable ports
    const vulnerablePorts = [1433, 3389, 5432, 27017, 6379, 9200];
    if (vulnerablePorts.includes(packet.destPort)) {
      factors.push({
        type: 'PROTOCOL',
        description: 'Connection to potentially vulnerable service',
        score: 55,
        weight: 0.2,
        evidence: `Port ${packet.destPort} hosts services commonly targeted by attackers`
      });
    }

    return factors;
  }

  private analyzeTiming(packet: NetworkPacket): AnomalyFactor[] {
    const factors: AnomalyFactor[] = [];
    const hour = new Date(packet.timestamp).getHours();

    // Check for off-hours activity (potential insider threat)
    if (hour < 6 || hour > 22) {
      factors.push({
        type: 'TIMING',
        description: 'Off-hours network activity',
        score: 35,
        weight: 0.1,
        evidence: `Activity at ${hour}:00 (outside normal business hours 6-22)`
      });
    }

    // Check for rapid sequential connections
    const recentSameSource = this.packetHistory.filter(p => 
      p.sourceIP === packet.sourceIP && 
      Math.abs(p.timestamp - packet.timestamp) < 100
    );

    if (recentSameSource.length > 10) {
      factors.push({
        type: 'TIMING',
        description: 'Rapid sequential connections',
        score: 70,
        weight: 0.2,
        evidence: `${recentSameSource.length} connections within 100ms from ${packet.sourceIP}`
      });
    }

    return factors;
  }

  private analyzeGeolocation(packet: NetworkPacket): AnomalyFactor[] {
    const factors: AnomalyFactor[] = [];

    // Check for private IP ranges (should be internal)
    const isPrivateIP = this.isPrivateIP(packet.sourceIP);
    const isInternalDest = this.isPrivateIP(packet.destIP);

    if (!isPrivateIP && !this.baseline.establishedConnections.includes(packet.sourceIP)) {
      factors.push({
        type: 'GEOLOCATION',
        description: 'Connection from unknown external IP',
        score: 50,
        weight: 0.15,
        evidence: `External IP ${packet.sourceIP} not in established connections list`
      });
    }

    // Check for suspicious IP patterns
    if (this.isSuspiciousIP(packet.sourceIP)) {
      factors.push({
        type: 'GEOLOCATION',
        description: 'Connection from suspicious IP range',
        score: 80,
        weight: 0.25,
        evidence: `IP ${packet.sourceIP} matches known suspicious patterns`
      });
    }

    return factors;
  }

  private analyzeBehavior(packet: NetworkPacket): AnomalyFactor[] {
    const factors: AnomalyFactor[] = [];

    // Check for port scanning behavior
    const sourcePackets = this.packetHistory.filter(p => 
      p.sourceIP === packet.sourceIP && 
      Date.now() - p.timestamp < 60000
    );

    const uniquePorts = new Set(sourcePackets.map(p => p.destPort));
    if (uniquePorts.size > 20) {
      factors.push({
        type: 'BEHAVIOR',
        description: 'Port scanning behavior detected',
        score: 85,
        weight: 0.3,
        evidence: `${packet.sourceIP} contacted ${uniquePorts.size} different ports in 1 minute`
      });
    }

    // Check for connection patterns
    const connectionKey = `${packet.sourceIP}:${packet.destIP}`;
    const connectionCount = this.connectionPatterns.get(connectionKey) || 0;

    if (connectionCount === 1) { // First time connection
      factors.push({
        type: 'BEHAVIOR',
        description: 'New connection established',
        score: 20,
        weight: 0.05,
        evidence: `First observed connection between ${packet.sourceIP} and ${packet.destIP}`
      });
    }

    return factors;
  }

  private analyzeSignatures(packet: NetworkPacket): AnomalyFactor[] {
    const factors: AnomalyFactor[] = [];

    // Check for malware signatures in packet characteristics
    const malwareSignatures = [
      { pattern: 'size:1337', description: 'Known malware packet size' },
      { pattern: 'port:4444', description: 'Common backdoor port' },
      { pattern: 'port:31337', description: 'Elite hacker port' }
    ];

    malwareSignatures.forEach(signature => {
      if (this.matchesSignature(packet, signature.pattern)) {
        factors.push({
          type: 'SIGNATURE',
          description: signature.description,
          score: 95,
          weight: 0.4,
          evidence: `Packet matches signature: ${signature.pattern}`
        });
      }
    });

    // Check for suspicious flag combinations
    if (packet.flags.includes('SYN') && packet.flags.includes('FIN')) {
      factors.push({
        type: 'SIGNATURE',
        description: 'Invalid TCP flag combination',
        score: 90,
        weight: 0.35,
        evidence: 'SYN and FIN flags set simultaneously (TCP stealth scan)'
      });
    }

    return factors;
  }

  private calculateAnomalyScore(factors: AnomalyFactor[]): number {
    if (factors.length === 0) return 0;

    const weightedScore = factors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight);
    }, 0);

    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    
    return totalWeight > 0 ? Math.min(100, Math.round(weightedScore / totalWeight)) : 0;
  }

  private determineVerdict(score: number): 'NORMAL' | 'SUSPICIOUS' | 'ANOMALOUS' | 'MALICIOUS' {
    if (score >= 80) return 'MALICIOUS';
    if (score >= 60) return 'ANOMALOUS';
    if (score >= 30) return 'SUSPICIOUS';
    return 'NORMAL';
  }

  private generateExplanation(factors: AnomalyFactor[], score: number, verdict: string): string {
    if (factors.length === 0) {
      return 'Packet appears normal with no anomalous characteristics detected.';
    }

    const topFactors = factors
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, 3);

    const explanations = topFactors.map(factor => factor.description);
    
    return `${verdict} packet (score: ${score}/100). Primary concerns: ${explanations.join(', ')}.`;
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./
    ];

    return privateRanges.some(range => range.test(ip));
  }

  private isSuspiciousIP(ip: string): boolean {
    // Known suspicious IP patterns (in real implementation, this would use threat intelligence)
    const suspiciousPatterns = [
      /^203\.0\.113\./, // TEST-NET-3 (often used in examples/attacks)
      /^198\.51\.100\./, // TEST-NET-2
      /^192\.0\.2\./, // TEST-NET-1
    ];

    return suspiciousPatterns.some(pattern => pattern.test(ip));
  }

  private matchesSignature(packet: NetworkPacket, pattern: string): boolean {
    const [type, value] = pattern.split(':');
    
    switch (type) {
      case 'size':
        return packet.size.toString() === value;
      case 'port':
        return packet.destPort.toString() === value || packet.sourcePort.toString() === value;
      default:
        return false;
    }
  }

  // Update baseline based on observed traffic
  updateBaseline(packets: NetworkPacket[]) {
    if (packets.length < 100) return; // Need sufficient data

    const sizes = packets.map(p => p.size);
    this.baseline.avgPacketSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;

    const protocols = [...new Set(packets.map(p => p.protocol))];
    this.baseline.typicalProtocols = protocols;

    const ports = packets.map(p => p.destPort);
    const portCounts = ports.reduce((acc, port) => {
      acc[port] = (acc[port] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    this.baseline.commonPorts = Object.entries(portCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([port]) => parseInt(port));
  }

  getBaseline(): BaselineMetrics {
    return { ...this.baseline };
  }

  getStatistics() {
    return {
      totalPackets: this.packetHistory.length,
      uniqueConnections: this.connectionPatterns.size,
      protocolDistribution: Object.fromEntries(this.protocolStats),
      topPorts: Object.fromEntries(
        [...this.portStats.entries()]
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
      )
    };
  }
}

export const anomalyDetector = AnomalyDetector.getInstance();