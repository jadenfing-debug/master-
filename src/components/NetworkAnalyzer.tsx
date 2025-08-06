import React from 'react';
import { Network, Activity, Globe, Server, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { NetworkPacket } from '../types/security';
import { format } from 'date-fns';

interface NetworkAnalyzerProps {
  packets: NetworkPacket[];
}

const NetworkAnalyzer: React.FC<NetworkAnalyzerProps> = ({ packets }) => {
  const [selectedPacket, setSelectedPacket] = React.useState<NetworkPacket | null>(null);

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'TCP': return 'text-blue-400 bg-blue-400/10';
      case 'UDP': return 'text-green-400 bg-green-400/10';
      case 'HTTP': return 'text-yellow-400 bg-yellow-400/10';
      case 'HTTPS': return 'text-purple-400 bg-purple-400/10';
      case 'ICMP': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getAnomalyColor = (score?: number) => {
    if (!score) return 'text-green-400';
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getAnomalyIcon = (score?: number) => {
    if (!score || score < 30) return <CheckCircle className="h-4 w-4 text-green-400" />;
    return <AlertCircle className="h-4 w-4 text-red-400" />;
  };
  const protocolStats = packets.reduce((acc, packet) => {
    acc[packet.protocol] = (acc[packet.protocol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const anomalousPackets = packets.filter(p => p.isAnomalous).length;
  return (
    <>
      <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Network className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Network Traffic Analyzer</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-gray-400">Anomalous: {anomalousPackets}</span>
            </div>
            {Object.entries(protocolStats).map(([protocol, count]) => (
              <div key={protocol} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${getProtocolColor(protocol).split(' ')[1]}`}></div>
                <span className="text-xs text-gray-400">{protocol}: {count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">Time</th>
                <th className="pb-3">Anomaly</th>
                <th className="pb-3">Protocol</th>
                <th className="pb-3">Source</th>
                <th className="pb-3">Destination</th>
                <th className="pb-3">Size</th>
                <th className="pb-3">Flags</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {packets.slice(0, 15).map((packet) => (
                <tr key={packet.id} className={`hover:bg-gray-700/30 transition-colors ${packet.isAnomalous ? 'bg-red-900/10' : ''}`}>
                  <td className="py-3 text-gray-300 font-mono text-xs">
                    {format(packet.timestamp, 'HH:mm:ss.SSS')}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      {getAnomalyIcon(packet.anomalyScore)}
                      <span className={`text-xs font-medium ${getAnomalyColor(packet.anomalyScore)}`}>
                        {packet.anomalyScore || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getProtocolColor(packet.protocol)}`}>
                      {packet.protocol}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300 font-mono text-xs">
                    {packet.sourceIP}:{packet.sourcePort}
                  </td>
                  <td className="py-3 text-gray-300 font-mono text-xs">
                    {packet.destIP}:{packet.destPort}
                  </td>
                  <td className="py-3 text-gray-300">
                    <span className="text-xs">{packet.size}B</span>
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-1">
                      {packet.flags.map((flag, idx) => (
                        <span key={idx} className="px-1 py-0.5 text-xs bg-gray-600 text-gray-300 rounded">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setSelectedPacket(packet)}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title="View anomaly analysis"
                    >
                      <Eye className="h-4 w-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {packets.length === 0 && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No network activity detected</p>
            <p className="text-sm text-gray-500 mt-2">Start monitoring to see traffic</p>
          </div>
        )}
      </div>
      </div>

      {/* Anomaly Analysis Modal */}
      {selectedPacket && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Packet Anomaly Analysis</h3>
                <button
                  onClick={() => setSelectedPacket(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="text-gray-400">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Packet Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Anomaly Score</div>
                  <div className={`text-2xl font-bold ${getAnomalyColor(selectedPacket.anomalyScore)}`}>
                    {selectedPacket.anomalyScore || 0}/100
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Protocol</div>
                  <div className="text-xl font-bold text-white">{selectedPacket.protocol}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Size</div>
                  <div className="text-xl font-bold text-white">{selectedPacket.size}B</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Status</div>
                  <div className={`text-xl font-bold ${selectedPacket.isAnomalous ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedPacket.isAnomalous ? 'ANOMALOUS' : 'NORMAL'}
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-3">Connection Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Source</div>
                    <div className="text-white font-mono">{selectedPacket.sourceIP}:{selectedPacket.sourcePort}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Destination</div>
                    <div className="text-white font-mono">{selectedPacket.destIP}:{selectedPacket.destPort}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Timestamp</div>
                    <div className="text-white">{format(selectedPacket.timestamp, 'PPpp')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Flags</div>
                    <div className="flex space-x-1">
                      {selectedPacket.flags.map((flag, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomaly Reasons */}
              {selectedPacket.anomalyReasons && selectedPacket.anomalyReasons.length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Anomaly Detection Factors</h4>
                  <div className="space-y-2">
                    {selectedPacket.anomalyReasons.map((reason, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Explanation */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-3">Analysis Summary</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedPacket.isAnomalous 
                    ? `This packet has been flagged as anomalous with a score of ${selectedPacket.anomalyScore}/100. The detection is based on ${selectedPacket.anomalyReasons?.length || 0} factors that deviate from normal network behavior patterns.`
                    : 'This packet appears to be normal network traffic with no significant anomalies detected. All characteristics fall within expected parameters for typical network communication.'
                  }
                </p>
              </div>

              {/* Recommendations */}
              {selectedPacket.isAnomalous && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-red-400 mb-3">Recommended Actions</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400">•</span>
                      <span>Monitor source IP {selectedPacket.sourceIP} for additional suspicious activity</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400">•</span>
                      <span>Review firewall rules for port {selectedPacket.destPort}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400">•</span>
                      <span>Consider implementing rate limiting if high frequency detected</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400">•</span>
                      <span>Document incident for security audit trail</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkAnalyzer;