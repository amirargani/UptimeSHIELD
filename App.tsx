import React, { useState, useEffect, useCallback } from 'react';
import {
  Service,
  ServiceStatus,
  LogEntry,
  AppSettings,
  Tab
} from './types';
import { Layout, Menu, Activity, Settings as SettingsIcon, Shield, Bell, X, Info } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ServiceManager } from './components/ServiceManager';
import { LogViewer } from './components/LogViewer';
import { Settings } from './components/Settings';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { analyzeLogFailure } from './services/geminiService';
import logo from './logo/UptimeSHIELD-Logo.ico';
import textLogo from './logo/UptimeSHIELD_Text Logo.png';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Load initial services from LocalStorage or use empty list
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('UptimeSHIELD_services');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist services to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('UptimeSHIELD_services', JSON.stringify(services));
  }, [services]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // AI Modal State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiAnalysisContent, setAiAnalysisContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    emailNotifications: true,
    recipientEmail: 'admin@UptimeSHIELD.local',
    smtpServer: 'smtp.local',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    checkInterval: 3,
    autoRestart: true,
    maxRetries: 3
  });

  const addLog = useCallback((level: LogEntry['level'], message: string, serviceId?: string, serviceName?: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      message,
      serviceId: serviceId || null,
      serviceName: serviceName || null
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // Simulation Engine
  useEffect(() => {
    if (!isMonitoring) return;

    const intervalId = setInterval(() => {
      setServices(currentServices => {
        return currentServices.map(service => {
          // Skip if paused or stopped intentionally
          if (service.status === ServiceStatus.PAUSED || service.status === ServiceStatus.STOPPED) {
            return service;
          }

          // Random Failure Simulation (Low chance)
          if (service.status === ServiceStatus.RUNNING) {
            if (Math.random() < 0.05) { // 5% chance of failure per tick
              const newState = settings.autoRestart ? ServiceStatus.RESTARTING : ServiceStatus.FAILED;
              addLog('ERROR', `Heartbeat failed for ${service.name}. Connection timed out.`, service.id, service.name);

              if (newState === ServiceStatus.RESTARTING) {
                addLog('WARNING', `Initiating auto-restart sequence for ${service.name}...`, service.id, service.name);
              }

              return {
                ...service,
                status: newState,
                failCount: service.failCount + 1
              };
            }
            // Update uptime slightly
            return { ...service, uptime: Math.min(100, service.uptime + 0.01) };
          }

          // Handle Restarting State
          if (service.status === ServiceStatus.RESTARTING) {
            // Simulate restart time (random success/fail)
            if (Math.random() > 0.3) {
              addLog('SUCCESS', `Service ${service.name} restarted successfully.`, service.id, service.name);
              return { ...service, status: ServiceStatus.RUNNING, lastRestart: new Date() };
            } else {
              if (service.failCount >= settings.maxRetries) {
                addLog('ERROR', `CRITICAL: ${service.name} failed to restart after ${service.failCount} attempts.`, service.id, service.name);
                if (settings.emailNotifications) {
                  addLog('INFO', `Sending failure notification email to ${settings.recipientEmail}`, service.id, service.name);
                }
                return { ...service, status: ServiceStatus.FAILED };
              }
              addLog('WARNING', `Restart attempt failed for ${service.name}. Retrying...`, service.id, service.name);
              return { ...service, failCount: service.failCount + 1 };
            }
          }

          return service;
        });
      });
    }, settings.checkInterval * 1000);

    return () => clearInterval(intervalId);
  }, [isMonitoring, settings, addLog]);

  // Handlers
  const toggleServiceStatus = (id: string) => {
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;

      const newStatus = s.status === ServiceStatus.STOPPED || s.status === ServiceStatus.PAUSED
        ? ServiceStatus.RUNNING
        : ServiceStatus.PAUSED;

      addLog('INFO', `User manually changed state of ${s.name} to ${newStatus}`, s.id, s.name);
      return { ...s, status: newStatus, failCount: 0 };
    }));
  };

  const removeService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    addLog('INFO', `Service configuration removed (ID: ${id})`);
  };

  const restartService = (id: string) => {
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;
      addLog('WARNING', `Manual restart initiated for ${s.name}`, s.id, s.name);
      return { ...s, status: ServiceStatus.RESTARTING };
    }));
  }

  const handleAIAnalysis = async (log: LogEntry) => {
    setIsAIModalOpen(true);
    setIsAnalyzing(true);
    setAiAnalysisContent('');

    const service = services.find(s => s.id === log.serviceId);
    const result = await analyzeLogFailure(log, service);

    setAiAnalysisContent(result);
    setIsAnalyzing(false);
  };

  // Render
  return (
    <div className="flex h-screen bg-[#000410] text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col bg-[#000410]">
        <div className="p-6 border-b border-slate-800">
          <div className="flex flex-col items-center">
            <img src={logo} alt="UptimeSHIELD Logo" />
            {/* <img src={textLogo} className="h-10" alt="UptimeSHIELD" /> */}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layout size={20} />} label="Dashboard" />
          <NavButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={<Activity size={20} />} label="Services" />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label="Settings" />
          <NavButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Menu size={20} />} label="System Logs" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              setIsMonitoring(!isMonitoring);
              addLog('INFO', isMonitoring ? 'Monitoring stopped by user.' : 'Monitoring started by user.');
            }}
            className={`w-full py-3 px-4 rounded-lg font-bold transition-all transform active:scale-95 shadow-lg ${isMonitoring
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'
              : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'
              }`}
          >
            {isMonitoring ? 'STOP MONITORING' : 'START MONITORING'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#000410]">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#000410]/50 backdrop-blur sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-400">
            {activeTab === 'dashboard' && 'Overview'}
            {activeTab === 'services' && 'Service Configuration'}
            {activeTab === 'logs' && 'Event History'}
            {activeTab === 'settings' && 'Global Preferences'}
          </h2>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isMonitoring
              ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0)]' // System Active
              : 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0)]' // System Offline
              }`}>
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs font-mono ${isMonitoring ? 'text-green-400' : 'text-red-400'}`}>
                {isMonitoring ? 'System Active' : 'System Offline'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-xs font-mono text-slate-400">v0.0.1-beta</span> {/* TODO: v1.0.0-stable */}
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              {services.some(s => s.status === ServiceStatus.FAILED) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              )}
            </button>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && <Dashboard services={services} />}
          {activeTab === 'services' && (
            <ServiceManager
              services={services}
              onToggleStatus={toggleServiceStatus}
              onRemove={removeService}
              onAdd={(serviceData: any) => {
                const newId = Math.random().toString(36).substr(2, 5);
                const newService: Service = {
                  ...serviceData,
                  id: newId,
                  status: ServiceStatus.STOPPED,
                  uptime: 0,
                  lastRestart: null,
                  failCount: 0
                };
                setServices([...services, newService]);
                addLog('INFO', `New service added: ${newService.name}`);
              }}
              onImport={(importedServices: Service[]) => {
                setServices(importedServices);
                addLog('SUCCESS', `Configuration imported: ${importedServices.length} services loaded.`);
              }}
              onRestart={restartService}
            />
          )}
          {activeTab === 'logs' && <LogViewer logs={logs} onAnalyze={handleAIAnalysis} />}
          {activeTab === 'settings' && <Settings settings={settings} onSave={setSettings} />}
        </div>
      </main>

      <AIAnalysisModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        content={aiAnalysisContent}
        isLoading={isAnalyzing}
      />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
      ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default App;