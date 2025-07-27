import React from 'react';
import { Bell, AlertCircle, Shield } from 'lucide-react';
import { ThreatAlert } from '../types/security';
import { format } from 'date-fns';

interface AlertCenterProps {
  threats: ThreatAlert[];
}

const AlertCenter: React.FC<AlertCenterProps> = ({ threats }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🔴';
      case 'HIGH': return '🟠';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Alert Center</h2>
          </div>
          {threats.length > 0 && (
            <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
              {threats.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {threats.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No active alerts</p>
            <p className="text-sm text-gray-500 mt-2">All systems secure</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threats.map((threat) => (
              <div key={threat.id} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getSeverityIcon(threat.severity)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white text-sm">{threat.type}</span>
                      <span className="text-xs text-gray-400">
                        {format(threat.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 truncate">{threat.description}</p>
                    <p className="text-xs text-gray-400 mt-1">From: {threat.sourceIP}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCenter;