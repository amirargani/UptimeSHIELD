import React from 'react';
import { AppSettings } from '../types';
import { Mail, Shield, Clock, Save, Bell, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { Switch } from './ui/Switch';
import { Badge } from './ui/Badge';

interface ConfigurationProps {
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({ settings, onSave }) => {
    const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
    const [saved, setSaved] = React.useState(false);

    const handleChange = (field: keyof AppSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        onSave(localSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-100">Configuration</h2>
                    <p className="text-slate-500 text-sm font-medium italic">Manage notification channels and monitoring thresholds.</p>
                </div>
                <Button
                    onClick={handleSave}
                    variant={saved ? "success" : "primary"}
                    className="w-full md:w-auto px-8 h-12 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300"
                >
                    {saved ? (
                        <>
                            <CheckCircle2 size={16} className="mr-2" />
                            Settings Saved
                        </>
                    ) : (
                        <>
                            <Save size={16} className="mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Email Settings */}
                <Card>
                    <CardHeader className="flex flex-row items-center !justify-start gap-4 bg-slate-950/30 border-b border-slate-800/50">
                        <div className="bg-blue-500/10 p-2.5 rounded-xl">
                            <Mail size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">Email Notifications</CardTitle>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Alert relay configuration</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl">
                            <div>
                                <Label className="mb-0">Critical Event Alerts</Label>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Send email on service failure</p>
                            </div>
                            <Switch
                                checked={localSettings.emailNotifications}
                                onChange={(checked) => handleChange('emailNotifications', checked)}
                            />
                        </div>

                        <div className={`space-y-6 transition-all duration-300 ${!localSettings.emailNotifications ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                            <div className="space-y-2">
                                <Label>Recipient Identity</Label>
                                <Input
                                    type="email"
                                    value={localSettings.recipientEmail}
                                    onChange={(e) => handleChange('recipientEmail', e.target.value)}
                                    placeholder="admin@internal.shield"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label>SMTP Host</Label>
                                    <Input
                                        value={localSettings.smtpServer}
                                        onChange={(e) => handleChange('smtpServer', e.target.value)}
                                        placeholder="smtp.office365.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>SMTP Port</Label>
                                    <Input
                                        type="number"
                                        value={localSettings.smtpPort}
                                        onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                                        placeholder="587"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>SMTP Username</Label>
                                    <Input
                                        value={localSettings.smtpUser}
                                        onChange={(e) => handleChange('smtpUser', e.target.value)}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>SMTP Password</Label>
                                    <Input
                                        type="password"
                                        value={localSettings.smtpPassword}
                                        onChange={(e) => handleChange('smtpPassword', e.target.value)}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Engine Settings */}
                <Card>
                    <CardHeader className="flex flex-row items-center !justify-start gap-4 bg-slate-950/30 border-b border-slate-800/50">
                        <div className="bg-green-500/10 p-2.5 rounded-xl">
                            <Shield size={20} className="text-green-500" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">Monitoring Engine</CardTitle>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Internal threshold logic</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="mb-0 flex items-center gap-2">
                                    <Clock size={14} className="text-blue-500" />
                                    Check Interval
                                </Label>
                                <Badge variant="info" animate className="!bg-[rgba(59,130,246,0.1)] !border-[rgba(59,130,246,0)]">
                                    {localSettings.checkInterval}s
                                </Badge>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={localSettings.checkInterval}
                                onChange={(e) => handleChange('checkInterval', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-600 tracking-widest">
                                <span>Real-time (1s)</span>
                                <span>Balanced (30s)</span>
                                <span>Lazy (60s)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl">
                            <div>
                                <Label className="mb-0">Autonomous Recovery</Label>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Attempt to restart failed units</p>
                            </div>
                            <Switch
                                checked={localSettings.autoRestart}
                                onChange={(checked) => handleChange('autoRestart', checked)}
                                variant="success"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Max Resilience Retries</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 3, 5, 10].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleChange('maxRetries', val)}
                                        className={`
                                            py-3 rounded-lg text-xs font-black uppercase tracking-tighter transition-all duration-200 border active:scale-[0.98]
                                            ${localSettings.maxRetries === val
                                                ? '!bg-[rgba(59,130,246,0.1)] !border-[rgba(59,130,246,0)] !text-blue-400 shadow-[0_0_5px_rgba(59,130,246,0.1)]'
                                                : 'bg-slate-800/20 border-transparent text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                                            }
                                        `}
                                    >
                                        {val}x
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">
                                Number of attempts before state is hard-marked as FAILED.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
