import React, { useState } from 'react';
import { AlertTriangle, Shield, X, Clock, MapPin } from 'lucide-react';
import { ThreatAlert } from '../types/security';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface ThreatMonitorProps {
  threats: ThreatAlert[];
}

const ThreatMonitor: React.FC<ThreatMonitorProps> = ({ threats }) => {
  const [selectedThreat, setSelectedThreat] = useState<ThreatAlert | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'HIGH': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'LOW': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'MALWARE': return '🦠';
      case 'INTRUSION': return '🚪';
      case 'ANOMALY': return '⚠️';
      case 'BRUTE_FORCE': return '🔨';
      case 'DDoS': return '💥';
      case 'DATA_EXFILTRATION': return '📤';
      default: return '🛡️';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Threat Monitor</h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Live Feed</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {threats.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No active threats detected</p>
            <p className="text-sm text-gray-500 mt-2">System is secure</p>
          </div>
        ) : (
          <div className="space-y-4">
            {threats.slice(0, 8).map((threat) => (
              <div
                key={threat.id}
                className={clsx(
                  'p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-gray-700/50',
                  getSeverityColor(threat.severity)
                )}
                onClick={() => setSelectedThreat(threat)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{getThreatIcon(threat.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white">{threat.type}</span>
                        <span className={clsx(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          getSeverityColor(threat.severity)
                        )}>
                          {threat.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{threat.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{threat.sourceIP}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(threat.timestamp, 'HH:mm:ss')}</span>
                        </div>
                        <span>Confidence: {threat.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {threat.blocked && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-600/20 text-red-400 rounded">
                        BLOCKED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Threat Details Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Threat Details</h3>
                <button
                  onClick={() => setSelectedThreat(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Threat Type</label>
                  <p className="text-white font-medium">{selectedThreat.type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Severity</label>
                  <p className={clsx('font-medium', getSeverityColor(selectedThreat.severity))}>
                    {selectedThreat.severity}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Source IP</label>
                  <p className="text-white font-mono">{selectedThreat.sourceIP}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Timestamp</label>
                  <p className="text-white">{format(selectedThreat.timestamp, 'PPpp')}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Confidence</label>
                  <p className="text-white">{selectedThreat.confidence}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <p className={clsx('font-medium', selectedThreat.blocked ? 'text-red-400' : 'text-yellow-400')}>
                    {selectedThreat.blocked ? 'BLOCKED' : 'MONITORING'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <p className="text-white mt-1">{selectedThreat.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatMonitor;