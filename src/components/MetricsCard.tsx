
import React from 'react';

interface MetricsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ label, value, icon, colorClass }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
};
