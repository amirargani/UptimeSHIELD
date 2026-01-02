import React, { useMemo } from 'react';
import { Service, ServiceStatus } from '../types';
import { Activity, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

interface OverviewProps {
    services: Service[];
}

export const Overview: React.FC<OverviewProps> = ({ services }) => {
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
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Live Uptime Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {uptimeData.filter(s => s.status === ServiceStatus.RUNNING).slice(0, 5).map((service, index) => {
                                // Generate fake historical data for sparkline (simulating last 12 hours)
                                const sparklineData = Array.from({ length: 12 }, (_, i) => ({
                                    value: Math.max(0, Math.min(100, service.uptime + (Math.random() - 0.5) * 10))
                                }));

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                                            {/* Service name and status */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-slate-100 transition-colors">
                                                    {service.name}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {service.status === ServiceStatus.RUNNING ? 'Running' :
                                                        service.status === ServiceStatus.FAILED ? 'Failed' :
                                                            service.status === ServiceStatus.RESTARTING ? 'Restarting' : 'Stopped'}
                                                </p>
                                            </div>

                                            {/* Mini Sparkline Chart */}
                                            <div className="w-32 h-12">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={sparklineData}>
                                                        <Line
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke={getBarColor(service.status)}
                                                            strokeWidth={2}
                                                            dot={false}
                                                            animationDuration={1000}
                                                            style={{
                                                                filter: `drop-shadow(0 0 4px ${getBarColor(service.status)}60)`
                                                            }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Uptime percentage */}
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-slate-100 tracking-tight">
                                                    {Math.round(service.uptime)}%
                                                </p>
                                                <p className="text-xs text-slate-500">uptime</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {uptimeData.filter(s => s.status === ServiceStatus.RUNNING).length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-sm italic">No running services</p>
                            </div>
                        )}
                        {uptimeData.filter(s => s.status === ServiceStatus.RUNNING).length > 10 && (
                            <p className="text-xs text-slate-500 text-center mt-4 italic">
                                Showing top 10 running services • {uptimeData.filter(s => s.status === ServiceStatus.RUNNING).length - 10} more in Services tab
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-center items-center text-center p-6">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center mb-4 relative">
                        <div className={`absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin duration-3000`}></div>
                        <Activity className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 uppercase tracking-tighter">Monitoring Active</h3>
                    <p className="text-slate-400 mt-2 text-sm italic">Engine checks every 2 seconds.</p>
                    <div className="mt-6">
                        <Badge variant="success" animate className="!bg-[rgba(34,197,94,0.1)] !border-[rgba(34,197,94,0)]">
                            SERVICE_RUNNING
                        </Badge>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, subtext: string, highlight?: boolean }> = ({ title, value, icon, subtext, highlight }) => (
    <Card className={`${highlight ? 'border-red-500/50 bg-red-500/5' : 'hover:border-slate-700'} transition-all duration-300`}>
        <CardContent className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-black text-slate-100 mt-2 tracking-tighter">{value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${highlight ? 'bg-red-500/10' : 'bg-slate-950'}`}>
                    {icon}
                </div>
            </div>
            <p className="text-[10px] font-bold text-slate-600 mt-4 uppercase tracking-widest">{subtext}</p>
        </CardContent>
    </Card>
);
