import React from 'react';
import { Service, ServiceStatus } from '../types';
import { Play, Square, RotateCw, Trash2, Plus, Zap, AlertOctagon, X, Download, Upload } from 'lucide-react';

interface ServiceManagerProps {
  services: Service[];
  onToggleStatus: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (service: any) => void;
  onImport: (services: Service[]) => void;
  onRestart: (id: string) => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({ services, onToggleStatus, onRemove, onAdd, onImport, onRestart }) => {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filterExternalServices = (services: any[]) => {
    return services.filter((s: any) => {
      const path = (s.PathName || "").replace(/"/g, "").toLowerCase();
      // Ensure path exists and does NOT start with system paths
      return (
        path &&
        !path.startsWith("c:\\windows") &&
        !path.startsWith("c:\\program files") &&
        !path.startsWith("c:\\programdata")
      );
    });
  };

  const fetchServices = async () => {
    try {
      setIsFetching(true);
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');

      const data = await response.json();
      const externalOnly = filterExternalServices(data);

      const mappedServices: Service[] = externalOnly.map((s: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: s.Name || s.DisplayName,
        description: s.DisplayName,
        status: s.State === 'Running' ? ServiceStatus.RUNNING : ServiceStatus.STOPPED,
        uptime: 0,
        lastRestart: null,
        failCount: 0
      }));

      if (mappedServices.length === 0) {
        alert('No external services found (excluding C:\\Windows, Program Files, etc).');
      } else {
        onImport(mappedServices);
        alert(`Found ${mappedServices.length} external services.`);
      }

    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Failed to fetch services from backend. Make sure the server is running.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(services, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "services.config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedServices = JSON.parse(content);
        if (Array.isArray(importedServices)) {
          onImport(importedServices);
        } else {
          alert('Invalid format: Expected an array of services');
        }
      } catch (error) {
        alert('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Service Management</h2>
          <p className="text-slate-400">Configure and control monitored applications.</p>
          <p className="text-sm font-bold text-rose-500 mt-1 flex items-center gap-1">
            <AlertOctagon className="w-4 h-4" />
            System services in <span className="font-mono bg-rose-500/20 px-1 rounded">C:\Windows</span>, <span className="font-mono bg-rose-500/20 px-1 rounded">Program Files</span> and <span className="font-mono bg-rose-500/20 px-1 rounded">ProgramData</span> are hidden by default.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".json"
          />
          <button
            onClick={() => handleExport()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Export Configuration"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Import Configuration"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={fetchServices}
            disabled={isFetching}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
            title="Auto-Fetch Services"
          >
            <RotateCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <div className="h-8 w-px bg-slate-800 mx-2"></div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#000410]/50 border-b border-slate-800">
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Service Name</th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Failures</th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {services.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No services configured. Click "Add New Service" to begin monitoring.
                </td>
              </tr>
            ) : services.map(service => (
              <tr key={service.id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="p-4">
                  <StatusBadge status={service.status} />
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-200">{service.name}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[200px]">{service.description}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${service.failCount > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {service.failCount}
                    </span>
                    {service.failCount > 0 && <span className="text-xs text-slate-600">restarts</span>}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {service.status === ServiceStatus.PAUSED || service.status === ServiceStatus.STOPPED ? (
                      <button
                        onClick={() => onToggleStatus(service.id)}
                        className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded transition-all"
                        title="Start Monitoring"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(service.id)}
                        className="p-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded transition-all"
                        title="Pause Monitoring"
                      >
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                    )}

                    <button
                      onClick={() => onRestart(service.id)}
                      className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded transition-all"
                      title="Restart Service"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onRemove(service.id)}
                      className="p-2 bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white rounded transition-all"
                      title="Remove Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddServiceModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(service) => {
            onAdd(service);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

interface AddServiceModalProps {
  onClose: () => void;
  onAdd: (service: any) => void;
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [availableServices, setAvailableServices] = React.useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = React.useState(false);

  React.useEffect(() => {
    const fetchAvailable = async () => {
      setIsLoadingServices(true);
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();

          // Filter logic duplicated here or passed as prop, but for now inline is fine
          const filtered = data.filter((s: any) => {
            const path = (s.PathName || "").replace(/"/g, "").toLowerCase();
            return (
              path &&
              !path.startsWith("c:\\windows") &&
              !path.startsWith("c:\\program files") &&
              !path.startsWith("c:\\programdata")
            );
          });

          // Sort alphabetically
          const sorted = filtered.sort((a: any, b: any) => (a.Name || '').localeCompare(b.Name || ''));
          setAvailableServices(sorted);
        }
      } catch (error) {
        console.error('Failed to load available services');
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchAvailable();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = availableServices.find(s => s.Name === e.target.value);
    if (selected) {
      setName(selected.Name);
      setDescription(selected.DisplayName || selected.Name);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      description,
      status: ServiceStatus.STOPPED,
      uptime: 0,
      lastRestart: null,
      failCount: 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Add New Service</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
            Select Detected Service {isLoadingServices && '(Loading...)'}
          </label>
          <select
            onChange={handleTemplateChange}
            disabled={isLoadingServices}
            className="w-full bg-[#000410] border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>-- Choose a Service --</option>
            {availableServices.map((s, idx) => (
              <option key={`${s.Name}-${idx}`} value={s.Name}>
                {s.DisplayName} ({s.Name})
              </option>
            ))}
          </select>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Service Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#000410] border border-slate-800 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g., Apache Tomcat"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#000410] border border-slate-800 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Brief description of the service"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20"
            >
              Add Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  switch (status) {
    case ServiceStatus.RUNNING:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
          <Zap className="w-3 h-3 fill-current" />
          Running
        </span>
      );
    case ServiceStatus.RESTARTING:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <RotateCw className="w-3 h-3 animate-spin" />
          Restarting
        </span>
      );
    case ServiceStatus.FAILED:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertOctagon className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-700">
          <Square className="w-3 h-3" />
          Stopped
        </span>
      );
  }
}