import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Wifi, Battery, Signal, Smartphone, Menu, X } from 'lucide-react';
import { securityEngine } from '../utils/securityEngine';
import { ThreatAlert, SystemMetrics, NetworkPacket } from '../types/security';
import MobilePermissionManager from './MobilePermissionManager';
import ThreatMonitor from './ThreatMonitor';
import NetworkAnalyzer from './NetworkAnalyzer';
import SystemStatus from './SystemStatus';
import AlertCenter from './AlertCenter';
import { clsx } from 'clsx';

const MobileDashboard: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'network' | 'system'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data states
  const [threats, setThreats] = useState<ThreatAlert[]>([]);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    // Subscribe to security engine updates
    const handleSecurityUpdate = (data: any) => {
      switch (data.type) {
        case 'threat':
          setThreats(prev => [data.data, ...prev.slice(0, 99)]);
          break;
        case 'packets':
          setPackets(data.data || []);
          break;
        case 'metrics':
          setMetrics(data.data);
          break;
        case 'status':
          setIsMonitoring(data.data.scanning);
          break;
      }
    };

    securityEngine.subscribe(handleSecurityUpdate);
    
    // Get device information
    getDeviceInfo();

    return () => {
      securityEngine.unsubscribe(handleSecurityUpdate);
    };
  }, []);

  const getDeviceInfo = () => {
    const info: any = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
      deviceMemory: (navigator as any).deviceMemory || 'Unknown',
      connection: (navigator as any).connection || null,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Detect mobile device
    info.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    info.isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    info.isDesktop = !info.isMobile && !info.isTablet;

    // Extract OS information
    if (/Android/i.test(navigator.userAgent)) {
      info.os = 'Android';
      const match = navigator.userAgent.match(/Android\s([0-9\.]*)/);
      info.osVersion = match ? match[1] : 'Unknown';
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      info.os = 'iOS';
      const match = navigator.userAgent.match(/OS\s([0-9_]*)/);
      info.osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown';
    } else {
      info.os = 'Unknown';
      info.osVersion = 'Unknown';
    }

    setDeviceInfo(info);
  };

  const handlePermissionsGranted = (permissions: Record<string, boolean>) => {
    securityEngine.setSystemPermissions(permissions);
    setShowPermissions(false);
    
    // Start monitoring if permissions are granted
    if (Object.values(permissions).some(granted => granted)) {
      startMonitoring();
    }
  };

  const startMonitoring = () => {
    securityEngine.startScanning();
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    securityEngine.stopScanning();
    setIsMonitoring(false);
  };

  const getConnectionInfo = () => {
    const connection = (navigator as any).connection;
    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType || 'Unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  };

  const getBatteryInfo = () => {
    // Battery API is deprecated but might still work on some devices
    return {
      level: 'Unknown',
      charging: 'Unknown'
    };
  };

  const activeThreats = threats.filter(t => !t.resolved);
  const criticalThreats = activeThreats.filter(t => t.severity === 'CRITICAL');
  const connectionInfo = getConnectionInfo();
  const batteryInfo = getBatteryInfo();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'threats', label: 'Threats', icon: AlertTriangle, badge: activeThreats.length },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'system', label: 'System', icon: Smartphone }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Shield className="h-6 w-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-semibold">CyberShield Mobile</h1>
              <p className="text-xs text-gray-400">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            {connectionInfo && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Signal className="h-4 w-4" />
                <span>{connectionInfo.effectiveType}</span>
              </div>
            )}
            
            {/* Battery Status */}
            <Battery className="h-4 w-4 text-gray-400" />
            
            {/* Monitoring Toggle */}
            <button
              onClick={isMonitoring ? stopMonitoring : () => setShowPermissions(true)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                isMonitoring
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              )}
            >
              {isMonitoring ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 overflow-x-auto">
        <div className="flex space-x-1 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Threats</p>
                    <p className="text-2xl font-bold text-red-400">{activeThreats.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Network Events</p>
                    <p className="text-2xl font-bold text-blue-400">{packets.length}</p>
                  </div>
                  <Wifi className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Device Information */}
            {deviceInfo && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Device Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">OS</p>
                    <p className="text-white">{deviceInfo.os} {deviceInfo.osVersion}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Device Type</p>
                    <p className="text-white">
                      {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Screen</p>
                    <p className="text-white">{deviceInfo.screen.width}×{deviceInfo.screen.height}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Memory</p>
                    <p className="text-white">{deviceInfo.deviceMemory}GB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Threats */}
            {activeThreats.length > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-medium text-white">Recent Threats</h3>
                </div>
                <div className="p-4">
                  <AlertCenter threats={activeThreats.slice(0, 3)} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'threats' && (
          <ThreatMonitor threats={threats} />
        )}

        {activeTab === 'network' && (
          <NetworkAnalyzer packets={packets} />
        )}

        {activeTab === 'system' && (
          <SystemStatus metrics={metrics} />
        )}
      </div>

      {/* Permission Manager Modal */}
      <MobilePermissionManager
        isVisible={showPermissions}
        onClose={() => setShowPermissions(false)}
        onPermissionsGranted={handlePermissionsGranted}
      />

      {/* Critical Threat Alert */}
      {criticalThreats.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-600 border border-red-500 rounded-lg p-4 shadow-lg z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-white" />
              <div>
                <p className="text-white font-medium">Critical Security Alert</p>
                <p className="text-red-100 text-sm">{criticalThreats.length} critical threat(s) detected</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('threats')}
              className="px-3 py-1 bg-white text-red-600 rounded text-sm font-medium"
            >
              View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;