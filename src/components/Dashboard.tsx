import React from 'react';
import MobileDashboard from './MobileDashboard';

interface DashboardProps {
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  // Detect if running on mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Use mobile dashboard for mobile devices
  if (isMobile) {
    return <MobileDashboard />;
  }

  // Original desktop dashboard
  return (
    <div className={`dashboard ${className}`}>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>
      <div className="dashboard-content">
        <p>Dashboard content will be displayed here.</p>
      </div>
    </div>
  );
};

export default Dashboard;