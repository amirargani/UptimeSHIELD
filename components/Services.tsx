import React from 'react';
import { Service, ServiceStatus } from '../types';
import { Play, Square, RotateCw, Trash2, Plus, Zap, AlertOctagon, Download, Upload, Eye, Info, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Alert } from './ui/Alert';
import { Input, Label } from './ui/Input';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Switch } from './ui/Switch';
import { Toast } from './ui/Toast';

interface ServicesProps {
    services: Service[];
    onToggleStatus: (id: string) => void;
    onRemove: (id: string) => void;
    onAdd: (service: any) => void;
    onImport: (services: Service[]) => void;
    onRestart: (id: string) => void;
    onClearAll?: () => void;
}

export const Services: React.FC<ServicesProps> = ({ services, onToggleStatus, onRemove, onAdd, onImport, onRestart, onClearAll }) => {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
    const [isPathModalOpen, setIsPathModalOpen] = React.useState(false);
    const [isFetching, setIsFetching] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [notification, setNotification] = React.useState<{ message: string, variant: 'default' | 'destructive' | 'success' | 'warning' | 'info', title?: string } | null>(null);
    const [showHiddenServices, setShowHiddenServices] = React.useState(() => {
        const saved = localStorage.getItem('showHiddenServices');
        return saved === 'true';
    });

    React.useEffect(() => {
        localStorage.setItem('showHiddenServices', showHiddenServices.toString());
    }, [showHiddenServices]);

    React.useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message: string, variant: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default', title?: string) => {
        setNotification({ message, variant, title });
    };

    const filterExternalServices = (services: any[]) => {

        if (showHiddenServices) return services;
        return services.filter((s: any) => {
            const path = (s.PathName || "").replace(/"/g, "").toLowerCase();
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
                showNotification('No external services found (excluding C:\\Windows, etc).', 'warning', 'No Services Found');
            } else {
                const existingNames = new Set(services.map(s => s.name.toLowerCase()));
                const newServices = mappedServices.filter(s => !existingNames.has(s.name.toLowerCase()));

                if (newServices.length === 0) {
                    showNotification(
                        `All ${mappedServices.length} scanned services are already in your dashboard.`,
                        'destructive',
                        'No New Services Added'
                    );
                } else {
                    onImport(newServices);
                    const duplicateMsg = mappedServices.length - newServices.length > 0
                        ? ` (${mappedServices.length - newServices.length} duplicates skipped)`
                        : '';
                    showNotification(
                        `Successfully added ${newServices.length} new services${duplicateMsg}.`,
                        'success',
                        'Scan Complete'
                    );
                }
            }

        } catch (error) {
            console.error('Error fetching services:', error);
            showNotification('Failed to fetch services from backend. Make sure the server is running.', 'destructive', 'Connection Error');
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
                    showNotification('Services configuration imported successfully.', 'success', 'Import Successful');
                } else {
                    showNotification('Invalid format: Expected an array of services', 'destructive', 'Import Failed');
                }
            } catch (error) {
                showNotification('Error parsing JSON file', 'destructive', 'Import Failed');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="w-full lg:w-auto">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Service Management</h2>
                    <p className="text-slate-500 text-sm font-medium italic">Configure and control monitored applications.</p>

                    {notification && (
                        <Toast
                            message={notification.message}
                            variant={notification.variant}
                            title={notification.title}
                        />
                    )}
                    <Alert
                        variant={showHiddenServices ? 'success' : 'destructive'}
                        className={`mt-3 w-full lg:w-fit py-2 px-3 ${showHiddenServices ? '!bg-[rgba(34,197,94,0.1)] !border-[rgba(34,197,94,0)]' : '!bg-[rgba(239,68,68,0.1)] !border-[rgba(239,68,68,0)]'}`}
                        icon={
                            <button
                                onClick={() => setIsPathModalOpen(true)}
                                className="text-current hover:opacity-80 transition-opacity"
                            >
                                <AlertTriangle size={20} className="animate-pulse" />
                            </button>
                        }
                    >
                        <div className="flex items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                                <span>System services in are {showHiddenServices ? 'SHOWN' : 'HIDDEN'}.</span>
                            </div>
                            <Switch checked={showHiddenServices} onChange={setShowHiddenServices} variant={showHiddenServices ? 'success' : 'danger'} />
                        </div>
                    </Alert>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-3 w-full lg:w-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    className="hidden"
                    accept=".json"
                />
                <div className="flex w-full sm:w-auto justify-between sm:justify-start bg-[#000410]/50 backdrop-blur-md border border-white/5 rounded-xl p-1 gap-2 sm:gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <Button variant="ghost" size="icon" onClick={() => handleExport()} title="Export Config">
                        <Download size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Import Config">
                        <Upload size={18} />
                    </Button>
                    <div className="w-px bg-slate-800 mx-1 my-1" />
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={fetchServices}
                        isLoading={isFetching}
                        className="flex-1 sm:flex-initial min-w-0"
                    >
                        <Zap className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Smart Fetch</span>
                    </Button>
                    <div className="w-px bg-slate-800 mx-1 my-1" />
                    {onClearAll && (
                        <Button
                            variant="destructive"
                            size="md"
                            onClick={() => {
                                if (services.length === 0) {
                                    showNotification('There are no services to delete.', 'warning', 'No Services Found');
                                    return;
                                }
                                setIsDeleteConfirmOpen(true);
                            }}
                            className="flex-1 sm:flex-initial min-w-0"
                        >
                            <Trash2 className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Delete All</span>
                        </Button>
                    )}
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    variant="primary"
                    className="w-full sm:w-auto h-11 px-6 text-[11px] font-black uppercase tracking-widest"
                >
                    <Plus size={16} className="mr-2" />
                    Add New Service
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Identitity</TableHead>
                            <TableHead>Analytics</TableHead>
                            <TableHead className="text-right">Operations</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-5 text-center text-slate-600 font-bold uppercase tracking-widest italic">
                                    [EMPTY] No services configured.
                                </TableCell>
                            </TableRow>
                        ) : services.map(service => (
                            <TableRow key={service.id}>
                                <TableCell>
                                    <StatusBadge status={service.status} />
                                </TableCell>
                                <TableCell>
                                    <div className="font-black text-slate-100 uppercase tracking-tight">{service.name}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[250px]">{service.description}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-600 uppercase">Failures</span>
                                            <span className={`text-sm font-black ${service.failCount > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                                {service.failCount}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {/* Operational Actions */}
                                        <div className="flex items-center gap-2">
                                            {service.status === ServiceStatus.PAUSED || service.status === ServiceStatus.STOPPED ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onToggleStatus(service.id)}
                                                    className="w-10 h-10 rounded-full text-slate-500 hover:bg-red-500 hover:text-green-500 hover:border-red-500 transition-all duration-300"
                                                    title="Start Service"
                                                >
                                                    <Play size={14} className="fill-current" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onToggleStatus(service.id)}
                                                    className="w-10 h-10 rounded-full text-slate-500 hover:bg-red-500 hover:text-red-500 hover:border-red-500 transition-all duration-300"
                                                    title="Pause Service"
                                                >
                                                    <Square size={12} className="fill-current" />
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onRestart(service.id)}
                                                className="w-10 h-10 rounded-full text-slate-500 hover:bg-red-500 hover:text-orange-500 hover:border-red-500 transition-all duration-300"
                                                title="Restart Service"
                                            >
                                                <RotateCw size={14} />
                                            </Button>
                                        </div>

                                        <div className="w-px h-8 bg-slate-800/50 mx-1" />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onRemove(service.id)}
                                            className="w-10 h-10 rounded-full text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300"
                                            title="Delete Entry"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Service"
                maxWidth="md"
            >
                <AddServiceForm
                    existingServices={services}
                    onShowNotification={showNotification}
                    onClose={() => setIsAddModalOpen(false)}
                    showHiddenServices={showHiddenServices}
                    onAdd={(service) => {
                        onAdd(service);
                        setIsAddModalOpen(false);
                    }}
                />
            </Modal>
            <Modal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title="Confirm Deletion"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <p className="text-slate-300 text-sm">
                        Are you sure you want to delete <strong className="text-red-400">ALL</strong> services? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (onClearAll) onClearAll();
                                showNotification('All services have been permanently deleted from the cluster.', 'success', 'System Cleared');
                                setIsDeleteConfirmOpen(false);
                            }}
                        >
                            Delete All
                        </Button>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={isPathModalOpen}
                onClose={() => setIsPathModalOpen(false)}
                title={showHiddenServices ? 'Included System Paths' : 'Excluded System Paths'}
                maxWidth="md"
            >
                <div className="space-y-4">
                    <p className="text-slate-300 text-sm">
                        The following system paths are {showHiddenServices ? 'included' : 'excluded'} from the service scan:
                    </p>
                    <div className="flex flex-col gap-3">
                        <Badge
                            variant={showHiddenServices ? "success" : "danger"}
                            animate
                            className={`text-sm px-3 py-2 ${showHiddenServices ? '!bg-[rgba(34,197,94,0.1)] !border-[rgba(34,197,94,0)]' : '!bg-[rgba(239,68,68,0.1)] !border-[rgba(239,68,68,0)]'}`}
                        >
                            "C:\Windows"
                        </Badge>
                        <Badge
                            variant={showHiddenServices ? "success" : "danger"}
                            animate
                            className={`text-sm px-3 py-2 ${showHiddenServices ? '!bg-[rgba(34,197,94,0.1)] !border-[rgba(34,197,94,0)]' : '!bg-[rgba(239,68,68,0.1)] !border-[rgba(239,68,68,0)]'}`}
                        >
                            "C:\Program Files"
                        </Badge>
                        <Badge
                            variant={showHiddenServices ? "success" : "danger"}
                            animate
                            className={`text-sm px-3 py-2 ${showHiddenServices ? '!bg-[rgba(34,197,94,0.1)] !border-[rgba(34,197,94,0)]' : '!bg-[rgba(239,68,68,0.1)] !border-[rgba(239,68,68,0)]'}`}
                        >
                            "C:\ProgramData"
                        </Badge>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button variant="ghost" onClick={() => setIsPathModalOpen(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

interface AddServiceFormProps {
    existingServices: Service[];
    onShowNotification: (message: string, variant: 'default' | 'destructive' | 'success' | 'warning' | 'info', title?: string) => void;
    onClose: () => void;
    onAdd: (service: any) => void;
    showHiddenServices: boolean;
}

const AddServiceForm: React.FC<AddServiceFormProps> = ({ existingServices, onShowNotification, onClose, onAdd, showHiddenServices }) => {
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
                    const filtered = showHiddenServices ? data : data.filter((s: any) => {
                        const path = (s.PathName || "").replace(/"/g, "").toLowerCase();
                        return (
                            path &&
                            !path.startsWith("c:\\windows") &&
                            !path.startsWith("c:\\program files") &&
                            !path.startsWith("c:\\programdata")
                        );
                    });
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
    }, [showHiddenServices]);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = availableServices.find(s => s.Name === e.target.value);
        if (selected) {
            setName(selected.Name);
            setDescription(selected.DisplayName || selected.Name);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // CHECK FOR DUPLICATES
        const isDuplicate = existingServices.some(s => s.name.toLowerCase() === name.toLowerCase());

        if (isDuplicate) {
            onShowNotification(
                `The service '${name}' is already monitoring.`,
                'destructive',
                'Duplicate Service'
            );
            return; // Stop here
        }

        onAdd({
            name,
            description,
            status: ServiceStatus.STOPPED,
            uptime: 0,
            lastRestart: null,
            failCount: 0
        });

        onShowNotification(
            `Service '${name}' added successfully.`,
            'success',
            'Service Added'
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label>Auto-Detected Services</Label>
                <select
                    onChange={handleTemplateChange}
                    disabled={isLoadingServices}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    defaultValue=""
                >
                    <option value="" disabled>{isLoadingServices ? 'SCANNING ENGINE...' : '-- SELECT SOURCE --'}</option>
                    {availableServices.map((s, idx) => (
                        <option key={`${s.Name}-${idx}`} value={s.Name}>
                            {s.DisplayName} ({s.Name})
                        </option>
                    ))}
                </select>
                <p className="mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Only external services are displayed</p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label>Internal Service Identity</Label>
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. MyServiceEngine"
                        required
                    />
                </div>
                <div>
                    <Label>Public Display Name</Label>
                    <Input
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. Production Application Server"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
                <Button variant="ghost" onClick={onClose} className="flex-1 uppercase font-black text-[10px] tracking-widest">
                    Dismiss
                </Button>
                <Button type="submit" variant="primary" className="flex-1 uppercase font-black text-[10px] tracking-widest">
                    Add Service
                </Button>
            </div>
        </form>
    );
};

const StatusBadge: React.FC<{ status: ServiceStatus }> = ({ status }) => {
    switch (status) {
        case ServiceStatus.RUNNING:
            return (
                <Badge variant="success" animate className="!bg-[rgba(34,197,94,0.1)] !border-[rgba(34,197,94,0)]">
                    Running
                </Badge>
            );
        case ServiceStatus.RESTARTING:
            return (
                <Badge variant="warning" animate className="!bg-[rgba(249,115,22,0.1)] !border-[rgba(249,115,22,0)] text-orange-400">
                    Restarting
                </Badge>
            );
        case ServiceStatus.FAILED:
            return (
                <Badge variant="danger" animate className="!bg-[rgba(239,68,68,0.1)] !border-[rgba(239,68,68,0)]">
                    Failed
                </Badge>
            );
        default:
            return (
                <Badge variant="danger" animate className="!bg-[rgba(239,68,68,0.1)] !border-[rgba(239,68,68,0)]">
                    Stopped
                </Badge>
            );
    }
}
