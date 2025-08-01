import React from 'react';
import { Cpu, HardDrive, Wifi, Activity } from 'lucide-react';
import { SystemMetrics } from '../types/security';

interface SystemStatusProps {
  metrics: SystemMetrics | null;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ metrics }) => {
  const getUsageColor = (usage: number) => {
    if (usage > 80) return 'text-red-400 bg-red-400';
    if (usage > 60) return 'text-yellow-400 bg-yellow-400';
    return 'text-green-400 bg-green-400';
  };

  const ProgressBar: React.FC<{ value: number; label: string; icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm text-gray-300">{label}</span>
        </div>
        <span className={`text-sm font-medium ${getUsageColor(value).split(' ')[0]}`}>
          {value}%
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(value).split(' ')[1]}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">System Status</h2>
        </div>
      </div>

      <div className="p-6">
        {metrics ? (
          <div className="space-y-6">
            <ProgressBar
              value={metrics.cpuUsage}
              label="CPU Usage (Real-time)"
              icon={<Cpu className="h-4 w-4 text-blue-400" />}
            />
            
            <ProgressBar
              value={metrics.memoryUsage}
              label="Memory Usage (Browser)"
              icon={<HardDrive className="h-4 w-4 text-purple-400" />}
            />

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Wifi className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-400">{metrics.networkIn}</p>
                <p className="text-xs text-gray-400">KB/s In</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Wifi className="h-5 w-5 text-blue-400 transform rotate-180" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{metrics.networkOut}</p>
                <p className="text-xs text-gray-400">KB/s Out</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Network Connections</span>
                <span className="text-lg font-semibold text-white">{metrics.activeConnections}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-400">Monitoring Status</span>
                <span className="text-sm font-semibold text-green-400">Real-time Active</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No system metrics available</p>
            <p className="text-sm text-gray-500 mt-2">Start real-time monitoring to collect live data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemStatus;