import React from 'react';
import { AppSettings } from '../types';
import { Mail, Shield, Clock, Save, Bell } from 'lucide-react';

interface SettingsProps {
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
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
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-100">Configuration</h2>
                <p className="text-slate-400">Manage notification channels and monitoring thresholds.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-200">Email Notifications</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300">Enable Alerts</label>
                            <button
                                onClick={() => handleChange('emailNotifications', !localSettings.emailNotifications)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${localSettings.emailNotifications ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.emailNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Recipient Email</label>
                            <input
                                type="email"
                                value={localSettings.recipientEmail}
                                onChange={(e) => handleChange('recipientEmail', e.target.value)}
                                className="w-full bg-[#000410] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="admin@company.com"
                                disabled={!localSettings.emailNotifications}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-400 mb-1">SMTP Server</label>
                                <input
                                    type="text"
                                    value={localSettings.smtpServer}
                                    onChange={(e) => handleChange('smtpServer', e.target.value)}
                                    className="w-full bg-[#000410] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="smtp.office365.com"
                                    disabled={!localSettings.emailNotifications}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Port</label>
                                <input
                                    type="number"
                                    value={localSettings.smtpPort}
                                    onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                                    className="w-full bg-[#000410] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="587"
                                    disabled={!localSettings.emailNotifications}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">SMTP User</label>
                                <input
                                    type="text"
                                    value={localSettings.smtpUser}
                                    onChange={(e) => handleChange('smtpUser', e.target.value)}
                                    className="w-full bg-[#000410] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    autoComplete="off"
                                    disabled={!localSettings.emailNotifications}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">SMTP Password</label>
                                <input
                                    type="password"
                                    value={localSettings.smtpPassword}
                                    onChange={(e) => handleChange('smtpPassword', e.target.value)}
                                    className="w-full bg-[#000410] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    autoComplete="new-password"
                                    disabled={!localSettings.emailNotifications}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engine Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-500/10 p-2 rounded-lg">
                            <Shield className="w-5 h-5 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-200">Monitoring Engine</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                                <Clock className="w-4 h-4" />
                                Check Interval (seconds)
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={localSettings.checkInterval}
                                onChange={(e) => handleChange('checkInterval', parseInt(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Fast (1s)</span>
                                <span className="text-blue-400 font-mono">{localSettings.checkInterval}s</span>
                                <span>Slow (60s)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                            <div>
                                <div className="text-sm font-medium text-slate-300">Auto-Restart</div>
                                <div className="text-xs text-slate-500">Attempt to recover failed services</div>
                            </div>
                            <button
                                onClick={() => handleChange('autoRestart', !localSettings.autoRestart)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${localSettings.autoRestart ? 'bg-green-600' : 'bg-slate-700'}`}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.autoRestart ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                            <div>
                                <div className="text-sm font-medium text-slate-300">Max Retries</div>
                                <div className="text-xs text-slate-500">Attempts before marking FAILED</div>
                            </div>
                            <select
                                value={localSettings.maxRetries}
                                onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
                                className="bg-[#000410] border border-slate-800 rounded px-2 py-1 text-sm text-slate-200"
                            >
                                <option value={1}>1 Attempt</option>
                                <option value={3}>3 Attempts</option>
                                <option value={5}>5 Attempts</option>
                                <option value={10}>10 Attempts</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${saved
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                >
                    {saved ? <CheckCircleIcon className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saved ? 'Settings Saved' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

const CheckCircleIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
)