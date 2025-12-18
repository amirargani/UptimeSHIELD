import React, { useMemo } from 'react';
import { Service, ServiceStatus } from '../types';
import { Activity, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  services: Service[];
}

export const Dashboard: React.FC<DashboardProps> = ({ services }) => {
  const stats = useMemo(() => {
    return {
      total: services.length,
      running: services.filter(s => s.status === ServiceStatus.RUNNING).length,
      stopped: services.filter(s => s.status === ServiceStatus.STOPPED || s.status === ServiceStatus.PAUSED).length,
      issues: services.filter(s => s.status === ServiceStatus.FAILED || s.status === ServiceStatus.RESTARTING).length,
    };
  }, [services]);

  const uptimeData = services.map(s => ({
    name: s.name,
    uptime: s.uptime,
    status: s.status
  }));

  const getBarColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.RUNNING: return '#22c55e'; // green-500
      case ServiceStatus.RESTARTING: return '#eab308'; // yellow-500
      case ServiceStatus.FAILED: return '#ef4444'; // red-500
      default: return '#64748b'; // slate-500
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Services"
          value={stats.total}
          icon={<Server className="w-6 h-6 text-blue-400" />}
          subtext="Configured for monitoring"
        />
        <StatCard
          title="Active & Healthy"
          value={stats.running}
          icon={<CheckCircle className="w-6 h-6 text-green-400" />}
          subtext="Running normally"
        />
        <StatCard
          title="Attention Needed"
          value={stats.issues}
          icon={<AlertTriangle className="w-6 h-6 text-red-400" />}
          subtext="Failed or restarting"
          highlight={stats.issues > 0}
        />
        <StatCard
          title="Average Uptime"
          value={`${Math.round(services.reduce((acc, s) => acc + s.uptime, 0) / (services.length || 1))}%`}
          icon={<Activity className="w-6 h-6 text-purple-400" />}
          subtext="Last 24 hours"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Live Uptime Metrics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uptimeData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Bar dataKey="uptime" barSize={20} radius={[0, 4, 4, 0]}>
                  {uptimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center mb-4 relative">
            <div className={`absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin duration-3000`}></div>
            <Activity className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">Monitoring Active</h3>
          <p className="text-slate-400 mt-2 text-sm">Engine checks every 2 seconds.</p>
          <div className="mt-6 flex gap-2">
            <span className="flex items-center gap-1.5 text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              SERVICE_RUNNING
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, subtext: string, highlight?: boolean }> = ({ title, value, icon, subtext, highlight }) => (
  <div className={`bg-slate-900 border ${highlight ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'} rounded-xl p-6 transition-all duration-300 hover:border-slate-700`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-slate-100 mt-2">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${highlight ? 'bg-red-500/10' : 'bg-slate-800'}`}>
        {icon}
      </div>
    </div>
    <p className="text-xs text-slate-500 mt-4">{subtext}</p>
  </div>
);
