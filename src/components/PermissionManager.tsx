import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Lock, Unlock, Monitor, Network, HardDrive, Eye } from 'lucide-react';
import { clsx } from 'clsx';

interface Permission {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'granted' | 'denied' | 'prompt' | 'checking';
  required: boolean;
  apiName?: string;
}

interface PermissionManagerProps {
  onPermissionsGranted: (permissions: Record<string, boolean>) => void;
  isVisible: boolean;
  onClose: () => void;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ 
  onPermissionsGranted, 
  isVisible, 
  onClose 
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      name: 'Performance Monitoring',
      description: 'Monitor network performance and resource timing for real-time analysis',
      icon: <Monitor className="h-5 w-5" />,
      status: 'checking',
      required: true,
      apiName: 'performance'
    },
    {
      name: 'Network Information',
      description: 'Access network connection details and bandwidth information',
      icon: <Network className="h-5 w-5" />,
      status: 'checking',
      required: true,
      apiName: 'connection'
    },
    {
      name: 'Storage Access',
      description: 'Monitor storage usage and file system operations',
      icon: <HardDrive className="h-5 w-5" />,
      status: 'checking',
      required: false,
      apiName: 'storage'
    },
    {
      name: 'Geolocation',
      description: 'Detect suspicious geographic locations for enhanced security',
      icon: <Eye className="h-5 w-5" />,
      status: 'checking',
      required: false,
      apiName: 'geolocation'
    },
    {
      name: 'Notifications',
      description: 'Send real-time security alerts and threat notifications',
      icon: <AlertTriangle className="h-5 w-5" />,
      status: 'checking',
      required: false,
      apiName: 'notifications'
    }
  ]);

  const [isRequesting, setIsRequesting] = useState(false);
  const [allPermissionsChecked, setAllPermissionsChecked] = useState(false);

  useEffect(() => {
    if (isVisible) {
      checkAllPermissions();
    }
  }, [isVisible]);

  const checkAllPermissions = async () => {
    const updatedPermissions = await Promise.all(
      permissions.map(async (permission) => {
        const status = await checkPermission(permission.apiName || permission.name.toLowerCase());
        return { ...permission, status };
      })
    );
    
    setPermissions(updatedPermissions);
    setAllPermissionsChecked(true);
  };

  const checkPermission = async (apiName: string): Promise<'granted' | 'denied' | 'prompt'> => {
    try {
      switch (apiName) {
        case 'performance':
          // Check if Performance Observer is available
          return typeof PerformanceObserver !== 'undefined' ? 'granted' : 'denied';
          
        case 'connection':
          // Check if Network Information API is available
          return 'connection' in navigator ? 'granted' : 'denied';
          
        case 'storage':
          // Check if Storage API is available
          if ('storage' in navigator && 'estimate' in navigator.storage) {
            return 'granted';
          }
          return 'denied';
          
        case 'geolocation':
          if ('geolocation' in navigator) {
            return new Promise((resolve) => {
              navigator.permissions?.query({ name: 'geolocation' as PermissionName })
                .then(result => resolve(result.state as 'granted' | 'denied' | 'prompt'))
                .catch(() => resolve('prompt'));
            });
          }
          return 'denied';
          
        case 'notifications':
          if ('Notification' in window) {
            const permission = Notification.permission;
            return permission === 'default' ? 'prompt' : permission as 'granted' | 'denied';
          }
          return 'denied';
          
        default:
          return 'denied';
      }
    } catch (error) {
      console.error(`Error checking permission for ${apiName}:`, error);
      return 'denied';
    }
  };

  const requestPermission = async (permission: Permission) => {
    try {
      let granted = false;
      
      switch (permission.apiName) {
        case 'geolocation':
          if ('geolocation' in navigator) {
            try {
              await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
              });
              granted = true;
            } catch {
              granted = false;
            }
          }
          break;
          
        case 'notifications':
          if ('Notification' in window) {
            const result = await Notification.requestPermission();
            granted = result === 'granted';
          }
          break;
          
        case 'storage':
          if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
              await navigator.storage.estimate();
              granted = true;
            } catch {
              granted = false;
            }
          }
          break;
          
        default:
          // For APIs that don't require explicit permission
          granted = true;
          break;
      }
      
      const newStatus: 'granted' | 'denied' = granted ? 'granted' : 'denied';
      
      setPermissions(prev => 
        prev.map(p => 
          p.name === permission.name 
            ? { ...p, status: newStatus }
            : p
        )
      );
      
      return granted;
    } catch (error) {
      console.error(`Error requesting permission for ${permission.name}:`, error);
      setPermissions(prev => 
        prev.map(p => 
          p.name === permission.name 
            ? { ...p, status: 'denied' }
            : p
        )
      );
      return false;
    }
  };

  const requestAllPermissions = async () => {
    setIsRequesting(true);
    
    const results: Record<string, boolean> = {};
    
    for (const permission of permissions) {
      if (permission.status === 'prompt' || permission.status === 'denied') {
        const granted = await requestPermission(permission);
        results[permission.apiName || permission.name.toLowerCase()] = granted;
      } else if (permission.status === 'granted') {
        results[permission.apiName || permission.name.toLowerCase()] = true;
      }
    }
    
    setIsRequesting(false);
    onPermissionsGranted(results);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'prompt':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'checking':
        return <div className="h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'prompt':
        return 'Permission Required';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'denied':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'prompt':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'checking':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const requiredPermissions = permissions.filter(p => p.required);
  const optionalPermissions = permissions.filter(p => !p.required);
  const grantedRequired = requiredPermissions.filter(p => p.status === 'granted').length;
  const canProceed = grantedRequired === requiredPermissions.length;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h2 className="text-2xl font-semibold text-white">System Permissions Required</h2>
                <p className="text-gray-400">Grant permissions for real-time system analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canProceed ? (
                <Unlock className="h-6 w-6 text-green-400" />
              ) : (
                <Lock className="h-6 w-6 text-red-400" />
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-blue-400 font-medium mb-2">Why These Permissions?</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    CyberShield IDS requires access to system APIs to provide real-time security monitoring. 
                    These permissions enable the system to analyze network traffic, monitor system resources, 
                    and detect potential security threats in real-time. All data is processed locally and 
                    never transmitted to external servers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Required Permissions */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              Required Permissions ({grantedRequired}/{requiredPermissions.length})
            </h3>
            <div className="space-y-3">
              {requiredPermissions.map((permission, index) => (
                <div
                  key={index}
                  className={clsx(
                    'p-4 rounded-lg border transition-all duration-200',
                    getStatusColor(permission.status)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">{permission.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{permission.name}</h4>
                        <p className="text-sm text-gray-300">{permission.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(permission.status)}
                        <span className="text-sm font-medium">
                          {getStatusText(permission.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Permissions */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              Optional Permissions (Enhanced Features)
            </h3>
            <div className="space-y-3">
              {optionalPermissions.map((permission, index) => (
                <div
                  key={index}
                  className={clsx(
                    'p-4 rounded-lg border transition-all duration-200',
                    getStatusColor(permission.status)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">{permission.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{permission.name}</h4>
                        <p className="text-sm text-gray-300">{permission.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(permission.status)}
                        <span className="text-sm font-medium">
                          {getStatusText(permission.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mb-6">
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Privacy & Security Notice
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• All monitoring is performed locally in your browser</li>
                <li>• No personal data or packet contents are stored</li>
                <li>• IP addresses are anonymized in logs</li>
                <li>• Data is automatically cleaned up after 24 hours</li>
                <li>• You can revoke permissions at any time</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex space-x-3">
              {!allPermissionsChecked && (
                <button
                  onClick={checkAllPermissions}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Check Permissions
                </button>
              )}
              
              {allPermissionsChecked && (
                <button
                  onClick={requestAllPermissions}
                  disabled={isRequesting}
                  className={clsx(
                    'px-6 py-2 rounded-lg font-medium transition-all duration-200',
                    canProceed
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white',
                    isRequesting && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isRequesting ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Requesting Permissions...</span>
                    </div>
                  ) : canProceed ? (
                    'Start Real-time Monitoring'
                  ) : (
                    'Request Required Permissions'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;