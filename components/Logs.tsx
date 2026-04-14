import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Bot, Terminal, Search, AlertCircle, Info, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface LogsProps {
    logs: LogEntry[];
    onAnalyze: (log: LogEntry) => void;
}

export const Logs: React.FC<LogsProps> = ({ logs, onAnalyze }) => {
    const getLogColor = (level: string) => {
        switch (level) {
            case 'ERROR': 
            case 'STOPPED': 
            case 'FAILED':
                return 'text-red-400';
            case 'WARNING': 
            case 'RESTARTING':
            case 'STARTING':
            case 'PAUSED':
                return 'text-yellow-400';
            case 'SUCCESS': 
            case 'RUNNING':
                return 'text-green-400';
            default: return 'text-slate-300';
        }
    };

    const getBadgeVariant = (level: string): any => {
        switch (level) {
            case 'ERROR': 
            case 'FAILED':
            case 'STOPPED': 
                return 'danger';
            case 'WARNING': 
            case 'RESTARTING':
            case 'STARTING':
            case 'PAUSED':
                return 'warning';
            case 'SUCCESS': 
            case 'RUNNING':
                return 'success';
            default: return 'neutral';
        }
    };

    const getBadgeStyles = (level: string) => {
        switch (level) {
            case 'ERROR': 
            case 'FAILED':
            case 'STOPPED':
                return '!bg-[rgba(239,68,68,0.1)] !border-[rgba(239,68,68,0)] text-red-500';
            case 'WARNING': 
            case 'RESTARTING':
            case 'STARTING':
            case 'PAUSED':
                return '!bg-[rgba(245,158,11,0.1)] !border-[rgba(245,158,11,0)] text-yellow-500';
            case 'SUCCESS': 
            case 'RUNNING':
                return '!bg-[rgba(34,197,94,0.1)] !border-[rgba(34,197,94,0)] text-green-500';
            default: return '!bg-[rgba(148,163,184,0.1)] !border-[rgba(148,163,184,0)]';
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in text-slate-100">
            <div className="flex justify-between items-end border-b border-slate-800 pb-6">
                <div className="bg-slate-950 rounded-lg flex items-center px-4 py-2 gap-3 text-slate-500">
                    <Search size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Filter logs...</span>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col shadow-inner font-mono text-sm relative">
                <div className="bg-slate-950 p-2.5 border-b border-slate-800/50 flex gap-2 items-center px-4">
                    <Terminal size={14} className="text-slate-600" />
                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">UptimeSHIELD / logs / services.log</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-[#000410]/40">
                    {logs.length === 0 && (
                        <div className="text-slate-700 text-center mt-40 italic font-medium">
                            [SYSTEM] Waiting for incoming heartbeat events...
                        </div>
                    )}
                    {logs.slice().reverse().map((log) => (
                        <div key={log.id} className="group flex gap-4 p-3 rounded-lg transition-colors items-start border-l-2 border-transparent hover:border-slate-700 bg-slate-900/20 mb-2">
                            <span className="text-slate-500 shrink-0 select-none text-[11px] font-bold mt-0.5 w-[75px]">
                                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>

                            <Badge
                                variant={getBadgeVariant(log.level)}
                                animate={log.level !== 'INFO'}
                                className={`shrink-0 min-w-[90px] justify-center text-[10px] ${getBadgeStyles(log.level)}`}
                            >
                                {log.level}
                            </Badge>

                            <span className="text-slate-300 break-words flex-1 leading-relaxed text-sm">
                                {log.serviceName && <span className="text-blue-400 font-bold mr-3 tracking-wide">[{log.serviceName}]</span>}
                                {log.message}
                            </span>

                            {log.level === 'ERROR' && (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => onAnalyze(log)}
                                    className="opacity-0 group-hover:opacity-100 py-1 h-7 px-3 text-[10px] uppercase font-black tracking-widest transition-opacity"
                                >
                                    <Bot size={12} className="mr-1.5" />
                                    AI Analyze
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
