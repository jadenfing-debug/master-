import React from 'react';
import { Network, Activity, Globe, Server } from 'lucide-react';
import { NetworkPacket } from '../types/security';
import { format } from 'date-fns';

interface NetworkAnalyzerProps {
  packets: NetworkPacket[];
}

const NetworkAnalyzer: React.FC<NetworkAnalyzerProps> = ({ packets }) => {
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

  const protocolStats = packets.reduce((acc, packet) => {
    acc[packet.protocol] = (acc[packet.protocol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Network className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Network Traffic Analyzer</h2>
          </div>
          <div className="flex items-center space-x-4">
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
                <th className="pb-3">Protocol</th>
                <th className="pb-3">Source</th>
                <th className="pb-3">Destination</th>
                <th className="pb-3">Size</th>
                <th className="pb-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {packets.slice(0, 15).map((packet) => (
                <tr key={packet.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 text-gray-300 font-mono text-xs">
                    {format(packet.timestamp, 'HH:mm:ss.SSS')}
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
  );
};

export default NetworkAnalyzer;