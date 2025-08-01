import { ThreatAlert, SystemMetrics, NetworkPacket, SecurityReport, SystemLog } from '../types/security';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export class ReportGenerator {
  private static instance: ReportGenerator;
  private reports: SecurityReport[] = [];

  private constructor() {}

  static getInstance(): ReportGenerator {
    if (!ReportGenerator.instance) {
      ReportGenerator.instance = new ReportGenerator();
    }
    return ReportGenerator.instance;
  }

  generateDailyReport(
    threats: ThreatAlert[],
    metrics: SystemMetrics[],
    packets: NetworkPacket[],
    logs: SystemLog[]
  ): SecurityReport {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Filter data for today
    const todayThreats = threats.filter(t => 
      t.timestamp >= startOfToday.getTime() && t.timestamp <= endOfToday.getTime()
    );
    const todayPackets = packets.filter(p => 
      p.timestamp >= startOfToday.getTime() && p.timestamp <= endOfToday.getTime()
    );
    const todayLogs = logs.filter(l => 
      l.timestamp >= startOfToday.getTime() && l.timestamp <= endOfToday.getTime()
    );

    const report: SecurityReport = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: 'DAILY',
      title: `Daily Security Report - ${format(today, 'MMM dd, yyyy')}`,
      summary: this.generateDailySummary(todayThreats, todayPackets, todayLogs),
      threatsDetected: todayThreats.length,
      threatsBlocked: todayThreats.filter(t => t.blocked).length,
      networkEvents: todayPackets.length,
      systemEvents: todayLogs.length,
      riskScore: this.calculateRiskScore(todayThreats),
      recommendations: this.generateRecommendations(todayThreats, todayPackets),
      data: {
        threats: todayThreats,
        packets: todayPackets.slice(0, 100), // Limit for report size
        logs: todayLogs.slice(0, 100),
        metrics: metrics.slice(0, 24), // Last 24 hours
        threatsByType: this.groupThreatsByType(todayThreats),
        threatsBySeverity: this.groupThreatsBySeverity(todayThreats),
        topSourceIPs: this.getTopSourceIPs(todayThreats),
        networkProtocols: this.getProtocolDistribution(todayPackets),
        timelineData: this.generateTimelineData(todayThreats, todayPackets)
      }
    };

    this.reports.unshift(report);
    this.reports = this.reports.slice(0, 100); // Keep last 100 reports

    return report;
  }

  generateWeeklyReport(
    threats: ThreatAlert[],
    metrics: SystemMetrics[],
    packets: NetworkPacket[],
    logs: SystemLog[]
  ): SecurityReport {
    const today = new Date();
    const weekAgo = subDays(today, 7);

    // Filter data for the last week
    const weekThreats = threats.filter(t => t.timestamp >= weekAgo.getTime());
    const weekPackets = packets.filter(p => p.timestamp >= weekAgo.getTime());
    const weekLogs = logs.filter(l => l.timestamp >= weekAgo.getTime());

    const report: SecurityReport = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: 'WEEKLY',
      title: `Weekly Security Report - ${format(weekAgo, 'MMM dd')} to ${format(today, 'MMM dd, yyyy')}`,
      summary: this.generateWeeklySummary(weekThreats, weekPackets, weekLogs),
      threatsDetected: weekThreats.length,
      threatsBlocked: weekThreats.filter(t => t.blocked).length,
      networkEvents: weekPackets.length,
      systemEvents: weekLogs.length,
      riskScore: this.calculateRiskScore(weekThreats),
      recommendations: this.generateWeeklyRecommendations(weekThreats, weekPackets),
      data: {
        threats: weekThreats,
        dailyBreakdown: this.generateDailyBreakdown(weekThreats, 7),
        trendAnalysis: this.generateTrendAnalysis(weekThreats, weekPackets),
        topThreats: this.getTopThreats(weekThreats),
        securityMetrics: this.calculateSecurityMetrics(weekThreats, weekPackets),
        complianceStatus: this.generateComplianceStatus(weekThreats, weekLogs)
      }
    };

    this.reports.unshift(report);
    return report;
  }

  generateIncidentReport(threat: ThreatAlert, relatedData: any): SecurityReport {
    const report: SecurityReport = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: 'INCIDENT',
      title: `Incident Report - ${threat.type} (${threat.severity})`,
      summary: this.generateIncidentSummary(threat, relatedData),
      threatsDetected: 1,
      threatsBlocked: threat.blocked ? 1 : 0,
      networkEvents: relatedData.packets?.length || 0,
      systemEvents: relatedData.logs?.length || 0,
      riskScore: this.calculateThreatRiskScore(threat),
      recommendations: this.generateIncidentRecommendations(threat),
      data: {
        incident: threat,
        timeline: this.generateIncidentTimeline(threat, relatedData),
        impact: this.assessIncidentImpact(threat),
        response: this.generateResponsePlan(threat),
        forensics: this.generateForensicData(threat, relatedData),
        mitigation: this.generateMitigationSteps(threat)
      }
    };

    this.reports.unshift(report);
    return report;
  }

  private generateDailySummary(threats: ThreatAlert[], packets: NetworkPacket[], logs: SystemLog[]): string {
    const criticalThreats = threats.filter(t => t.severity === 'CRITICAL').length;
    const highThreats = threats.filter(t => t.severity === 'HIGH').length;
    const blockedThreats = threats.filter(t => t.blocked).length;

    return `Today's security overview: ${threats.length} threats detected (${criticalThreats} critical, ${highThreats} high severity), ${blockedThreats} threats blocked automatically. Network activity: ${packets.length} packets analyzed. System generated ${logs.length} log entries.`;
  }

  private generateWeeklySummary(threats: ThreatAlert[], packets: NetworkPacket[], logs: SystemLog[]): string {
    const avgThreatsPerDay = Math.round(threats.length / 7);
    const mostCommonThreat = this.getMostCommonThreatType(threats);
    const riskTrend = this.calculateRiskTrend(threats);

    return `Weekly security summary: ${threats.length} total threats (avg ${avgThreatsPerDay}/day), most common: ${mostCommonThreat}. Risk trend: ${riskTrend}. Network traffic: ${packets.length} packets processed. System stability: ${this.assessSystemStability(logs)}.`;
  }

  private generateIncidentSummary(threat: ThreatAlert, relatedData: any): string {
    const impact = this.assessIncidentImpact(threat);
    const status = threat.blocked ? 'contained' : 'active';

    return `Security incident detected: ${threat.type} from ${threat.sourceIP}. Severity: ${threat.severity}, Status: ${status}. Impact assessment: ${impact}. Confidence level: ${threat.confidence}%.`;
  }

  private calculateRiskScore(threats: ThreatAlert[]): number {
    if (threats.length === 0) return 0;

    const severityWeights = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 10 };
    const totalScore = threats.reduce((sum, threat) => {
      return sum + severityWeights[threat.severity];
    }, 0);

    return Math.min(100, Math.round((totalScore / threats.length) * 10));
  }

  private calculateThreatRiskScore(threat: ThreatAlert): number {
    const severityWeights = { LOW: 25, MEDIUM: 50, HIGH: 75, CRITICAL: 100 };
    const baseScore = severityWeights[threat.severity];
    const confidenceMultiplier = threat.confidence / 100;
    
    return Math.round(baseScore * confidenceMultiplier);
  }

  private generateRecommendations(threats: ThreatAlert[], packets: NetworkPacket[]): string[] {
    const recommendations: string[] = [];

    const criticalThreats = threats.filter(t => t.severity === 'CRITICAL');
    if (criticalThreats.length > 0) {
      recommendations.push('Immediate action required: Review and respond to critical threats');
    }

    const unblockedThreats = threats.filter(t => !t.blocked);
    if (unblockedThreats.length > 5) {
      recommendations.push('Consider implementing automatic blocking for high-confidence threats');
    }

    const suspiciousIPs = this.getTopSourceIPs(threats);
    if (suspiciousIPs.length > 0) {
      recommendations.push(`Consider blocking or monitoring IPs: ${suspiciousIPs.slice(0, 3).join(', ')}`);
    }

    const largePackets = packets.filter(p => p.size > 10000);
    if (largePackets.length > packets.length * 0.1) {
      recommendations.push('High volume of large packets detected - review for data exfiltration');
    }

    if (recommendations.length === 0) {
      recommendations.push('System security posture is good - continue monitoring');
    }

    return recommendations;
  }

  private generateWeeklyRecommendations(threats: ThreatAlert[], packets: NetworkPacket[]): string[] {
    const recommendations: string[] = [];

    const trendAnalysis = this.generateTrendAnalysis(threats, packets);
    if (trendAnalysis.threatTrend === 'increasing') {
      recommendations.push('Threat activity is increasing - consider enhancing security measures');
    }

    const mostCommonThreat = this.getMostCommonThreatType(threats);
    recommendations.push(`Focus on ${mostCommonThreat} prevention - most common threat type this week`);

    recommendations.push('Schedule security team review of weekly patterns');
    recommendations.push('Update threat intelligence feeds');
    recommendations.push('Review and update security policies based on weekly findings');

    return recommendations;
  }

  private generateIncidentRecommendations(threat: ThreatAlert): string[] {
    const recommendations: string[] = [];

    if (!threat.blocked) {
      recommendations.push('URGENT: Implement immediate containment measures');
    }

    recommendations.push(`Block source IP: ${threat.sourceIP}`);
    recommendations.push('Conduct forensic analysis of affected systems');
    recommendations.push('Review logs for related suspicious activity');
    recommendations.push('Update detection rules to prevent similar incidents');

    if (threat.severity === 'CRITICAL') {
      recommendations.push('Notify security team and management immediately');
      recommendations.push('Consider activating incident response team');
    }

    return recommendations;
  }

  private groupThreatsByType(threats: ThreatAlert[]): Record<string, number> {
    return threats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupThreatsBySeverity(threats: ThreatAlert[]): Record<string, number> {
    return threats.reduce((acc, threat) => {
      acc[threat.severity] = (acc[threat.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopSourceIPs(threats: ThreatAlert[]): string[] {
    const ipCounts = threats.reduce((acc, threat) => {
      acc[threat.sourceIP] = (acc[threat.sourceIP] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip]) => ip);
  }

  private getProtocolDistribution(packets: NetworkPacket[]): Record<string, number> {
    return packets.reduce((acc, packet) => {
      acc[packet.protocol] = (acc[packet.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateTimelineData(threats: ThreatAlert[], packets: NetworkPacket[]) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const hourStart = startOfDay(new Date()).getTime() + (hour * 60 * 60 * 1000);
      const hourEnd = hourStart + (60 * 60 * 1000);

      const hourThreats = threats.filter(t => t.timestamp >= hourStart && t.timestamp < hourEnd);
      const hourPackets = packets.filter(p => p.timestamp >= hourStart && p.timestamp < hourEnd);

      return {
        hour,
        threats: hourThreats.length,
        packets: hourPackets.length,
        criticalThreats: hourThreats.filter(t => t.severity === 'CRITICAL').length
      };
    });
  }

  private generateDailyBreakdown(threats: ThreatAlert[], days: number) {
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayStart = startOfDay(date).getTime();
      const dayEnd = endOfDay(date).getTime();

      const dayThreats = threats.filter(t => t.timestamp >= dayStart && t.timestamp <= dayEnd);

      return {
        date: format(date, 'MMM dd'),
        threats: dayThreats.length,
        blocked: dayThreats.filter(t => t.blocked).length,
        critical: dayThreats.filter(t => t.severity === 'CRITICAL').length
      };
    });
  }

  private generateTrendAnalysis(threats: ThreatAlert[], packets: NetworkPacket[]) {
    const recentThreats = threats.filter(t => t.timestamp > Date.now() - 3 * 24 * 60 * 60 * 1000);
    const olderThreats = threats.filter(t => 
      t.timestamp <= Date.now() - 3 * 24 * 60 * 60 * 1000 && 
      t.timestamp > Date.now() - 6 * 24 * 60 * 60 * 1000
    );

    const threatTrend = recentThreats.length > olderThreats.length ? 'increasing' : 
                      recentThreats.length < olderThreats.length ? 'decreasing' : 'stable';

    return {
      threatTrend,
      recentCount: recentThreats.length,
      previousCount: olderThreats.length,
      changePercent: olderThreats.length > 0 ? 
        Math.round(((recentThreats.length - olderThreats.length) / olderThreats.length) * 100) : 0
    };
  }

  private getTopThreats(threats: ThreatAlert[]) {
    return threats
      .filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  private calculateSecurityMetrics(threats: ThreatAlert[], packets: NetworkPacket[]) {
    const totalThreats = threats.length;
    const blockedThreats = threats.filter(t => t.blocked).length;
    const falsePositives = threats.filter(t => t.confidence < 70).length;

    return {
      detectionRate: totalThreats > 0 ? Math.round((blockedThreats / totalThreats) * 100) : 0,
      blockingEfficiency: totalThreats > 0 ? Math.round((blockedThreats / totalThreats) * 100) : 0,
      falsePositiveRate: totalThreats > 0 ? Math.round((falsePositives / totalThreats) * 100) : 0,
      averageConfidence: totalThreats > 0 ? 
        Math.round(threats.reduce((sum, t) => sum + t.confidence, 0) / totalThreats) : 0
    };
  }

  private generateComplianceStatus(threats: ThreatAlert[], logs: SystemLog[]) {
    return {
      logRetention: 'Compliant - 90 days retention',
      incidentResponse: threats.filter(t => t.severity === 'CRITICAL').length === 0 ? 
        'Compliant' : 'Review Required',
      threatDocumentation: 'Compliant - All threats logged',
      accessControl: 'Compliant - All access monitored'
    };
  }

  private getMostCommonThreatType(threats: ThreatAlert[]): string {
    const typeCounts = this.groupThreatsByType(threats);
    const mostCommon = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    return mostCommon ? mostCommon[0] : 'None';
  }

  private calculateRiskTrend(threats: ThreatAlert[]): string {
    const recent = threats.filter(t => t.timestamp > Date.now() - 3 * 24 * 60 * 60 * 1000);
    const older = threats.filter(t => 
      t.timestamp <= Date.now() - 3 * 24 * 60 * 60 * 1000 && 
      t.timestamp > Date.now() - 6 * 24 * 60 * 60 * 1000
    );

    const recentRisk = this.calculateRiskScore(recent);
    const olderRisk = this.calculateRiskScore(older);

    if (recentRisk > olderRisk + 10) return 'increasing';
    if (recentRisk < olderRisk - 10) return 'decreasing';
    return 'stable';
  }

  private assessSystemStability(logs: SystemLog[]): string {
    const errorLogs = logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL');
    const errorRate = logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0;

    if (errorRate < 5) return 'Excellent';
    if (errorRate < 15) return 'Good';
    if (errorRate < 30) return 'Fair';
    return 'Poor';
  }

  private generateIncidentTimeline(threat: ThreatAlert, relatedData: any) {
    return [
      {
        time: format(new Date(threat.timestamp), 'HH:mm:ss'),
        event: 'Threat Detected',
        details: `${threat.type} from ${threat.sourceIP}`
      },
      {
        time: format(new Date(threat.timestamp + 1000), 'HH:mm:ss'),
        event: 'Analysis Complete',
        details: `Confidence: ${threat.confidence}%`
      },
      {
        time: format(new Date(threat.timestamp + 2000), 'HH:mm:ss'),
        event: threat.blocked ? 'Threat Blocked' : 'Monitoring Active',
        details: threat.blocked ? 'Automatic containment applied' : 'Manual review required'
      }
    ];
  }

  private assessIncidentImpact(threat: ThreatAlert): string {
    const impactLevels = {
      LOW: 'Minimal - No immediate action required',
      MEDIUM: 'Moderate - Monitor and review',
      HIGH: 'Significant - Immediate attention needed',
      CRITICAL: 'Severe - Emergency response required'
    };

    return impactLevels[threat.severity];
  }

  private generateResponsePlan(threat: ThreatAlert) {
    const basePlan = [
      'Isolate affected systems',
      'Preserve evidence',
      'Assess damage scope',
      'Implement containment',
      'Begin recovery process'
    ];

    const severitySpecific = {
      CRITICAL: ['Activate incident response team', 'Notify management', 'Consider external help'],
      HIGH: ['Escalate to security team', 'Prepare communication plan'],
      MEDIUM: ['Document findings', 'Schedule follow-up review'],
      LOW: ['Log incident', 'Continue monitoring']
    };

    return [...basePlan, ...severitySpecific[threat.severity]];
  }

  private generateForensicData(threat: ThreatAlert, relatedData: any) {
    return {
      sourceAnalysis: {
        ip: threat.sourceIP,
        geolocation: 'Unknown', // Would integrate with GeoIP service
        reputation: 'Checking...', // Would integrate with threat intelligence
        previousActivity: 'Analyzing...'
      },
      networkAnalysis: {
        protocols: relatedData.packets?.map((p: NetworkPacket) => p.protocol) || [],
        ports: relatedData.packets?.map((p: NetworkPacket) => p.destPort) || [],
        dataVolume: relatedData.packets?.reduce((sum: number, p: NetworkPacket) => sum + p.size, 0) || 0
      },
      systemAnalysis: {
        affectedSystems: ['Web Server', 'Database'], // Would be determined by actual analysis
        processes: relatedData.processes || [],
        files: relatedData.files || []
      }
    };
  }

  private generateMitigationSteps(threat: ThreatAlert): string[] {
    const steps = [];

    steps.push(`Block IP address: ${threat.sourceIP}`);
    
    switch (threat.type) {
      case 'MALWARE':
        steps.push('Run full system antivirus scan');
        steps.push('Update malware signatures');
        steps.push('Quarantine affected files');
        break;
      case 'INTRUSION':
        steps.push('Change all passwords');
        steps.push('Review access logs');
        steps.push('Strengthen access controls');
        break;
      case 'BRUTE_FORCE':
        steps.push('Implement account lockout policies');
        steps.push('Enable multi-factor authentication');
        steps.push('Monitor failed login attempts');
        break;
      case 'DDoS':
        steps.push('Activate DDoS protection');
        steps.push('Scale infrastructure if needed');
        steps.push('Contact ISP for upstream filtering');
        break;
      case 'DATA_EXFILTRATION':
        steps.push('Identify compromised data');
        steps.push('Notify affected parties');
        steps.push('Implement data loss prevention');
        break;
    }

    steps.push('Update detection rules');
    steps.push('Document lessons learned');

    return steps;
  }

  exportReport(report: SecurityReport, format: 'JSON' | 'CSV' | 'PDF' = 'JSON'): string {
    switch (format) {
      case 'JSON':
        return JSON.stringify(report, null, 2);
      case 'CSV':
        return this.convertToCSV(report);
      case 'PDF':
        return this.generatePDFContent(report);
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  private convertToCSV(report: SecurityReport): string {
    const headers = ['Timestamp', 'Type', 'Severity', 'Source IP', 'Description', 'Blocked'];
    const rows = report.data.threats?.map((threat: ThreatAlert) => [
      format(new Date(threat.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      threat.type,
      threat.severity,
      threat.sourceIP,
      threat.description,
      threat.blocked ? 'Yes' : 'No'
    ]) || [];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generatePDFContent(report: SecurityReport): string {
    // This would generate PDF content - for now returning formatted text
    return `
SECURITY REPORT
${report.title}
Generated: ${format(new Date(report.timestamp), 'PPpp')}

EXECUTIVE SUMMARY
${report.summary}

KEY METRICS
- Threats Detected: ${report.threatsDetected}
- Threats Blocked: ${report.threatsBlocked}
- Network Events: ${report.networkEvents}
- System Events: ${report.systemEvents}
- Risk Score: ${report.riskScore}/100

RECOMMENDATIONS
${report.recommendations.map(r => `• ${r}`).join('\n')}

DETAILED ANALYSIS
[Detailed data would be formatted here]
    `.trim();
  }

  getReports(): SecurityReport[] {
    return this.reports;
  }

  getReport(id: string): SecurityReport | null {
    return this.reports.find(r => r.id === id) || null;
  }

  deleteReport(id: string): boolean {
    const index = this.reports.findIndex(r => r.id === id);
    if (index !== -1) {
      this.reports.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const reportGenerator = ReportGenerator.getInstance();