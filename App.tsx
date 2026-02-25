import React, { useState, useEffect, useCallback } from 'react';
import {
  Service,
  ServiceStatus,
  LogEntry,
  AppSettings,
  View
} from './types';
import { Layout, Menu, Activity, Settings as SettingsIcon, Shield, Bell, X, Info, Power, Terminal } from 'lucide-react';
import { Overview } from './components/Overview';
import { Services } from './components/Services';
import { Logs } from './components/Logs';
import { Configuration } from './components/Configuration';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { analyzeLogFailure } from './services/geminiService';
import logo from './logo/UptimeSHIELD-Logo.ico';

import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { NavButton } from './components/ui/NavButton';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(() => {
    return (localStorage.getItem('UptimeSHIELD_activeView') as View) || 'overview';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('UptimeSHIELD_activeView', activeView);
  }, [activeView]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('UptimeSHIELD_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.services) parsed.services = [];
        return parsed;
      } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
      }
    }
    return {
      emailNotifications: true,
      recipientEmail: 'admin@UptimeSHIELD.local',
      smtpServer: 'smtp.local',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      checkInterval: 3,
      autoRestart: true,
      maxRetries: 3,
      certValidityDays: 365,
      autoRenewCert: true,
      services: []
    };
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from server on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          if (data && typeof data === 'object') {
            setSettings(prev => ({ ...prev, ...data }));
            setIsLoaded(true);
            console.log("[App] Config loaded from server and merged with local defaults.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch config from server", error);
        // Even if fetch fails, we allow local changes to sync eventually
        // but maybe we should wait for a manual retry? 
        // For now, let's treat it as loaded if we want to allow offline use.
        setIsLoaded(true);
      }
    };
    fetchConfig();
  }, []);

  // Sync to localStorage AND server
  useEffect(() => {
    localStorage.setItem('UptimeSHIELD_settings', JSON.stringify(settings));

    const syncConfig = async () => {
      if (!isLoaded) {
        console.log("[App] Skipping server sync: not loaded yet.");
        return;
      }

      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
      } catch (error) {
        console.error("Failed to sync config to server", error);
      }
    };

    const debounce = setTimeout(syncConfig, 1000);
    return () => clearTimeout(debounce);
  }, [settings, isLoaded]);

  // Derived/helper states
  const services = settings.services || [];
  const setServices = (update: Service[] | ((prev: Service[]) => Service[])) => {
    setSettings(prev => ({
      ...prev,
      services: typeof update === 'function' ? update(prev.services || []) : update
    }));
  };

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiAnalysisContent, setAiAnalysisContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  useEffect(() => {
    if (!isMonitoring) return;

    const intervalId = setInterval(() => {
      setServices(currentServices => {
        return currentServices.map(service => {
          if (service.status === ServiceStatus.PAUSED || service.status === ServiceStatus.STOPPED) {
            return service;
          }

          if (service.status === ServiceStatus.RUNNING) {
            if (Math.random() < 0.05) {
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
            return { ...service, uptime: Math.min(100, service.uptime + 0.01) };
          }

          if (service.status === ServiceStatus.RESTARTING) {
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

  const clearAllServices = () => {
    setServices([]);
    addLog('INFO', 'All services cleared by user action.');
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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#000410] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Mobile Header Overlay for Menu Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#000410] z-30">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-40 animate-pulse" />
            <div className="relative bg-[#000410] p-2 rounded-lg border border-slate-800">
              <img src={logo} alt="Logo" className="w-6 h-6" />
            </div>
          </div>
          <span className="font-extrabold tracking-widest text-sm">UPTIME<span className="text-blue-500">SHIELD</span></span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      <aside className={`
        fixed inset-0 z-50 bg-[#000410] transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-72 md:border-r md:border-slate-800 md:flex md:flex-col md:shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden absolute top-4 right-4 z-[60]">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </Button>
        </div>

        <div className="p-8 border-b border-slate-800/50 flex flex-col items-center">
          {/* Desktop Logo (unchanged) */}
          <div className="relative group cursor-pointer hidden md:block">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-75 transition duration-500 group-hover:duration-200 animate-pulse" />
            <div className="relative bg-[#000410] p-4 rounded-xl border border-slate-800 transition-colors duration-300">
              <img src={logo} alt="UptimeSHIELD Logo" className="w-9 h-9 transition-transform duration-500 ease-in-out" />
            </div>
          </div>
          <h1 className="mt-4 text-xs font-black tracking-[0.2em] text-slate-100 hidden md:block">Uptime<span className="uppercase text-blue-500">Shield</span></h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 hidden md:block">Enterprise Monitoring</p>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          <NavButton active={activeView === 'overview'} onClick={() => { setActiveView('overview'); setIsMobileMenuOpen(false); }} icon={<Layout size={18} />} label="Overview" />
          <NavButton active={activeView === 'services'} onClick={() => { setActiveView('services'); setIsMobileMenuOpen(false); }} icon={<Activity size={18} />} label="Services" />
          <NavButton active={activeView === 'logs'} onClick={() => { setActiveView('logs'); setIsMobileMenuOpen(false); }} icon={<Terminal size={18} />} label="Services Logs" />
          <NavButton active={activeView === 'configuration'} onClick={() => { setActiveView('configuration'); setIsMobileMenuOpen(false); }} icon={<SettingsIcon size={18} />} label="Configuration" />
        </nav>

        <div className="p-6 border-t border-slate-800/50 bg-slate-950/20">
          <Button
            onClick={() => {
              setIsMonitoring(!isMonitoring);
              addLog('INFO', isMonitoring ? 'Monitoring stopped by operational command.' : 'Monitoring engine initialized.');
            }}
            variant={isMonitoring ? "destructive" : "primary"}
            className={`w-full h-14 text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 ${isMonitoring ? 'border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' : ''}`}
          >
            {isMonitoring ? (
              <>
                <Power size={16} className="mr-2" />
                Kill Engine
              </>
            ) : (
              <>
                <Activity size={16} className="mr-2" />
                Launch Monitoring
              </>
            )}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#000410] flex flex-col w-full relative">
        <header className="h-auto py-[1em] border-b border-slate-800 flex items-center justify-between px-10 bg-[#000410]/80 backdrop-blur-xl sticky top-0 z-10 w-full transition-all duration-300">
          <div className="flex flex-col min-w-[200px]">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-0.5">Navigation Context</span>
            <h2 className="text-lg font-black text-slate-100 uppercase tracking-tighter">
              {activeView === 'overview' && 'Overview'}
              {activeView === 'services' && 'Services'}
              {activeView === 'logs' && 'Services Logs'}
              {activeView === 'configuration' && 'Configuration'}
            </h2>
            {activeView === 'overview' && (
              <p className="text-slate-500 text-[10px] font-medium italic mt-0.5 tracking-wider">
                Real-time health status and core system metrics.
              </p>
            )}
            {activeView === 'services' && (
              <p className="text-slate-500 text-[10px] font-medium italic mt-0.5 tracking-wider">
                Manage and monitor the status of your service cluster.
              </p>
            )}
            {activeView === 'logs' && (
              <p className="text-slate-500 text-[10px] font-medium italic mt-0.5 tracking-wider">
                Unified audit trail and real-time operational event stream.
              </p>
            )}
            {activeView === 'configuration' && (
              <p className="text-slate-500 text-[10px] font-medium italic mt-0.5 tracking-wider">
                System-wide settings, security certificates, and alert relays.
              </p>
            )}
          </div>

          <div className="flex items-center gap-6 justify-end">

            <div className="flex items-center gap-4 p-1.5 bg-slate-900/50 rounded-full pr-4">
              <Badge
                variant={isMonitoring ? "success" : "danger"}
                animate={isMonitoring}
                className={isMonitoring
                  ? '!bg-[rgba(34,197,94,0.1)] !border-[rgba(34,197,94,0)] !w-32 justify-center'
                  : '!bg-[rgba(239,68,68,0.1)] !border-[rgba(239,68,68,0)] !w-32 justify-center'
                }
              >
                {isMonitoring ? 'SYSTEM LIVE' : 'SYSTEM OFFLINE'}
              </Badge>

              <div className="h-4 w-px bg-slate-800" />

              <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                v0.0.3-beta
              </span>

              <div className="h-4 w-px bg-slate-800" />

              <button className="relative group p-1.5 text-slate-400 hover:text-white transition-all hover:bg-slate-800 rounded-full">
                <Bell size={14} />
                {services.some(s => s.status === ServiceStatus.FAILED) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-10 flex-1">
          {activeView === 'overview' && <Overview services={services} />}
          {activeView === 'services' && (
            <Services
              services={services}
              onToggleStatus={toggleServiceStatus}
              onRemove={removeService}
              onClearAll={clearAllServices}
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
                addLog('INFO', `Operational command: New service registered [${newService.name}]`);
              }}
              onImport={(importedServices: Service[]) => {
                setServices(importedServices);
                addLog('SUCCESS', `Cluster configuration imported: ${importedServices.length} nodes registered.`);
              }}
              onRestart={restartService}
            />
          )}
          {activeView === 'logs' && <Logs logs={logs} onAnalyze={handleAIAnalysis} />}
          {activeView === 'configuration' && <Configuration settings={settings} onSave={setSettings} />}
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



export default App;