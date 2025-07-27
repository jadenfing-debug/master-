import React from 'react';
import { Brain, CheckCircle, Clock, XCircle } from 'lucide-react';
import { securityEngine } from '../utils/securityEngine';
import { format } from 'date-fns';

const MLModelStatus: React.FC = () => {
  const models = securityEngine.getMLModels();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'TRAINING': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'INACTIVE': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/10';
      case 'TRAINING': return 'text-yellow-400 bg-yellow-400/10';
      case 'INACTIVE': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">ML Models</h2>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {models.map((model, index) => (
            <div key={index} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">{model.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Accuracy: {model.accuracy}%</span>
                    <span>Last trained: {format(model.lastTrained, 'MMM dd')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(model.status)}
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(model.status)}`}>
                    {model.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {model.detectionTypes.map((type, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MLModelStatus;