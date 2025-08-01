import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, AlertTriangle, Shield, Filter } from 'lucide-react';
import { SecurityReport } from '../types/security';
import { reportGenerator } from '../utils/reportGenerator';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface ReportCenterProps {
  threats: any[];
  metrics: any[];
  packets: any[];
  logs: any[];
}

const ReportCenter: React.FC<ReportCenterProps> = ({ threats, metrics, packets, logs }) => {
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INCIDENT'>('ALL');

  useEffect(() => {
    setReports(reportGenerator.getReports());
  }, []);

  const generateReport = async (type: 'DAILY' | 'WEEKLY' | 'INCIDENT') => {
    setIsGenerating(true);
    
    try {
      let report: SecurityReport;
      
      switch (type) {
        case 'DAILY':
          report = reportGenerator.generateDailyReport(threats, metrics, packets, logs);
          break;
        case 'WEEKLY':
          report = reportGenerator.generateWeeklyReport(threats, metrics, packets, logs);
          break;
        case 'INCIDENT':
          // Generate incident report for the most recent critical threat
          const criticalThreat = threats.find(t => t.severity === 'CRITICAL');
          if (criticalThreat) {
            report = reportGenerator.generateIncidentReport(criticalThreat, { packets, logs });
          } else {
            throw new Error('No critical threats found for incident report');
          }
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setReports(prev => [report, ...prev]);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (report: SecurityReport, format: 'JSON' | 'CSV' | 'PDF' = 'JSON') => {
    const content = reportGenerator.exportReport(report, format);
    const blob = new Blob([content], { 
      type: format === 'JSON' ? 'application/json' : 
           format === 'CSV' ? 'text/csv' : 'text/plain' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'DAILY': return <Calendar className="h-5 w-5 text-blue-400" />;
      case 'WEEKLY': return <TrendingUp className="h-5 w-5 text-green-400" />;
      case 'MONTHLY': return <Shield className="h-5 w-5 text-purple-400" />;
      case 'INCIDENT': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default: return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400 bg-red-400/10';
    if (score >= 60) return 'text-orange-400 bg-orange-400/10';
    if (score >= 40) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-green-400 bg-green-400/10';
  };

  const filteredReports = reports.filter(report => 
    filterType === 'ALL' || report.type === filterType
  );

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Security Reports</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
              >
                <option value="ALL">All Reports</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="INCIDENT">Incident</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => generateReport('DAILY')}
                disabled={isGenerating}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Daily Report
              </button>
              <button
                onClick={() => generateReport('WEEKLY')}
                disabled={isGenerating}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Weekly Report
              </button>
              <button
                onClick={() => generateReport('INCIDENT')}
                disabled={isGenerating || !threats.some(t => t.severity === 'CRITICAL')}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Incident Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isGenerating && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Generating report...</p>
          </div>
        )}

        {!isGenerating && filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No reports generated yet</p>
            <p className="text-sm text-gray-500 mt-2">Generate your first security report</p>
          </div>
        )}

        {!isGenerating && filteredReports.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reports List */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">Available Reports</h3>
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={clsx(
                    'p-4 rounded-lg border cursor-pointer transition-all duration-200',
                    selectedReport?.id === report.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                  )}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getReportIcon(report.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{report.title}</h4>
                        <p className="text-sm text-gray-400 mb-2">{report.summary}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{format(new Date(report.timestamp), 'MMM dd, HH:mm')}</span>
                          <span>{report.threatsDetected} threats</span>
                          <span className={clsx('px-2 py-1 rounded', getRiskScoreColor(report.riskScore))}>
                            Risk: {report.riskScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadReport(report);
                      }}
                      className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Report Details */}
            <div>
              {selectedReport ? (
                <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-white">Report Details</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadReport(selectedReport, 'JSON')}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => downloadReport(selectedReport, 'CSV')}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => downloadReport(selectedReport, 'PDF')}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-400">{selectedReport.threatsDetected}</div>
                        <div className="text-sm text-gray-400">Threats Detected</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-400">{selectedReport.threatsBlocked}</div>
                        <div className="text-sm text-gray-400">Threats Blocked</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-400">{selectedReport.networkEvents}</div>
                        <div className="text-sm text-gray-400">Network Events</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className={clsx('text-2xl font-bold', getRiskScoreColor(selectedReport.riskScore).split(' ')[0])}>
                          {selectedReport.riskScore}
                        </div>
                        <div className="text-sm text-gray-400">Risk Score</div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Executive Summary</h4>
                      <p className="text-sm text-gray-400">{selectedReport.summary}</p>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {selectedReport.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-400 flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Threat Breakdown */}
                    {selectedReport.data.threatsByType && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Threat Types</h4>
                        <div className="space-y-2">
                          {Object.entries(selectedReport.data.threatsByType).map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">{type}</span>
                              <span className="text-sm font-medium text-white">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600 text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Select a report to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCenter;