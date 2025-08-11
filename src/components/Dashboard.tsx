import React from 'react';

interface DashboardProps {
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
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