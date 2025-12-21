import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Bot, Terminal, Search, AlertCircle, Info, Check } from 'lucide-react';

interface LogViewerProps {
  logs: LogEntry[];
  onAnalyze: (log: LogEntry) => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, onAnalyze }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARNING': return 'text-yellow-400';
      case 'SUCCESS': return 'text-green-400';
      default: return 'text-slate-300';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'SUCCESS': return <Check className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">System Logs</h2>
          <p className="text-slate-400">Real-time event stream from the monitoring engine.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg flex items-center px-3 py-2 gap-2 text-slate-400">
          <Search className="w-4 h-4" />
          <span className="text-sm">Filter logs...</span>
        </div>
      </div>

      <div className="flex-1 bg-[#000410] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-inner font-mono text-sm relative">
        <div className="bg-slate-900 p-2 border-b border-slate-800 flex gap-2 items-center px-4">
          <Terminal className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500 text-xs">UptimeSHIELD/log/</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {logs.length === 0 && (
            <div className="text-slate-600 text-center mt-10 italic">Waiting for events...</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="group flex gap-3 hover:bg-slate-900/50 p-1 rounded -mx-1 items-start">
              <span className="text-slate-600 shrink-0 select-none">
                {log.timestamp.toLocaleTimeString([], { hour12: false })}
              </span>
              <span className={`shrink-0 ${getLogColor(log.level)}`}>
                [{log.level}]
              </span>
              <span className="text-slate-300 break-all flex-1">
                {log.serviceName && <span className="text-blue-400 mr-2">[{log.serviceName}]</span>}
                {log.message}
              </span>

              {log.level === 'ERROR' && (
                <button
                  onClick={() => onAnalyze(log)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded ml-2 shrink-0"
                >
                  <Bot className="w-3 h-3" />
                  Analyze
                </button>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};