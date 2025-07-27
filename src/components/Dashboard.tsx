import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Network, Cpu, HardDrive, Wifi, Lock } from 'lucide-react';
import { securityEngine } from '../utils/securityEngine';
import { ThreatAlert, SystemMetrics, NetworkPacket } from '../types/security';
import ThreatMonitor from './ThreatMonitor';
import NetworkAnalyzer from './NetworkAnalyzer';
import SystemStatus from './SystemStatus';
import MLModelStatus from './MLModelStatus';
import AlertCenter from './AlertCenter';

const Dashboard: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [activeThreats, setActiveThreats] = useState<ThreatAlert[]>([]);
  const [recentPackets, setRecentPackets] = useState<NetworkPacket[]>([]);
  const [threatCount, setThreatCount] = useState(0);

  useEffect(() => {
    const handleSecurityUpdate = (data: any) => {
      switch (data.type) {
        case 'threat':
          setActiveThreats(prev => [data.data, ...prev.slice(0, 49)]);
          setThreatCount(prev => prev + 1);
          break;
        case 'metrics':
          setCurrentMetrics(data.data);
          break;
        case 'packets':
          setRecentPackets(data.data);
          break;
      }
    };

    securityEngine.subscribe(handleSecurityUpdate);

    return () => {
      securityEngine.unsubscribe(handleSecurityUpdate);
    };
  }, []);

  const toggleScanning = () => {
    if (isScanning) {
      securityEngine.stopScanning();
    } else {
      securityEngine.startScanning();
    }
    setIsScanning(!isScanning);
  };

  const criticalThreats = activeThreats.filter(t => t.severity === 'CRITICAL').length;
  const highThreats = activeThreats.filter(t => t.severity === 'HIGH').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">CyberShield IDS</h1>
                <p className="text-sm text-gray-400">Advanced Intrusion Detection System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isScanning ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-300">
                  {isScanning ? 'Active Monitoring' : 'Standby'}
                </span>
              </div>
              
              <button
                onClick={toggleScanning}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isScanning
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isScanning ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Threats</p>
                <p className="text-2xl font-bold text-red-400">{activeThreats.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {criticalThreats} Critical, {highThreats} High
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Network Activity</p>
                <p className="text-2xl font-bold text-blue-400">
                  {currentMetrics?.networkIn || 0} KB/s
                </p>
              </div>
              <Network className="h-8 w-8 text-blue-400" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {recentPackets.length} packets/sec
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">System Load</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {currentMetrics?.cpuUsage || 0}%
                </p>
              </div>
              <Cpu className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Memory: {currentMetrics?.memoryUsage || 0}%
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Threats Blocked</p>
                <p className="text-2xl font-bold text-green-400">
                  {currentMetrics?.threatsBlocked || 0}
                </p>
              </div>
              <Lock className="h-8 w-8 text-green-400" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Last 24 hours
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <ThreatMonitor threats={activeThreats} />
            <NetworkAnalyzer packets={recentPackets} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <SystemStatus metrics={currentMetrics} />
            <MLModelStatus />
            <AlertCenter threats={activeThreats.slice(0, 5)} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;