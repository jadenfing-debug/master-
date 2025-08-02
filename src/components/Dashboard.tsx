import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Network, Cpu, HardDrive, Wifi, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { securityEngine } from '../utils/securityEngine';
import { ThreatAlert, SystemMetrics, NetworkPacket } from '../types/security';
import ThreatMonitor from './ThreatMonitor';
import NetworkAnalyzer from './NetworkAnalyzer';
import SystemStatus from './SystemStatus';
import MLModelStatus from './MLModelStatus';
import AlertCenter from './AlertCenter';
import ReportCenter from './ReportCenter';

const Dashboard: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [activeThreats, setActiveThreats] = useState<ThreatAlert[]>([]);
  const [recentPackets, setRecentPackets] = useState<NetworkPacket[]>([]);
  const [threatCount, setThreatCount] = useState(0);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'monitoring' | 'reports'>('monitoring');
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    const handleSecurityUpdate = (data: any) => {
      try {
        if (!data || !data.type) return;
        
        switch (data.type) {
          case 'threat':
            if (data.data) {
              setActiveThreats(prev => [data.data, ...prev.slice(0, 49)]);
              setThreatCount(prev => prev + 1);
            }
            break;
          case 'metrics':
            if (data.data) {
              setCurrentMetrics(data.data);
            }
            break;
          case 'packets':
            if (data.data) {
              setRecentPackets(data.data);
            }
            break;
          case 'log':
            if (data.data) {
              setSystemLogs(prev => [data.data, ...prev.slice(0, 999)]);
            }
            break;
          case 'status':
            if (data.data?.message) {
              console.log('System status:', data.data.message);
            }
            break;
          case 'error':
            if (data.data) {
              console.error('System error:', data.data);
            }
            break;
        }
      } catch (error) {
        console.error('Error handling security update:', error);
      }
    };

    securityEngine.subscribe(handleSecurityUpdate);

    // Health check interval
    const healthInterval = setInterval(() => {
      setSystemHealth(securityEngine.getSystemHealth());
    }, 5000);

    // Cleanup interval
    const cleanupInterval = setInterval(() => {
      securityEngine.cleanup();
    }, 60000); // Every minute

    return () => {
      securityEngine.unsubscribe(handleSecurityUpdate);
      clearInterval(healthInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  const toggleScanning = () => {
    try {
      if (isScanning) {
        securityEngine.stopScanning();
      } else {
        securityEngine.startScanning();
      }
      setIsScanning(!isScanning);
    } catch (error) {
      console.error('Error toggling scanning:', error);
      alert('Failed to toggle monitoring. Please try again.');
    }
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
                  {isScanning ? 'Real-time Monitoring Active' : 'Standby Mode'}
                </span>
              </div>
              
              {systemHealth && (
                <div className="text-xs text-gray-400">
                  {systemHealth.packetsCount} packets | {systemHealth.threatsCount} threats
                </div>
              )}
              
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
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={clsx(
              'px-6 py-3 rounded-lg font-medium transition-all duration-200',
              activeTab === 'monitoring'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}
          >
            Real-time Monitoring
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={clsx(
              'px-6 py-3 rounded-lg font-medium transition-all duration-200',
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}
          >
            Security Reports
          </button>
        </div>

        {activeTab === 'monitoring' && (
          <>
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
          </>
        )}

        {activeTab === 'reports' && (
          <ReportCenter 
            threats={activeThreats}
            metrics={currentMetrics ? [currentMetrics] : []}
            packets={recentPackets}
            logs={systemLogs}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;