import React from 'react';
import { AppSettings } from '../types';
import { Mail, Shield, Clock, Save, Bell, CheckCircle2, Lock, Key, FileJson, RotateCcw, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { Switch } from './ui/Switch';
import { Badge } from './ui/Badge';
import { Toast } from './ui/Toast';

interface ConfigurationProps {
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({ settings, onSave }) => {
    const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
    const [savedEmail, setSavedEmail] = React.useState(false);
    const [savedEngine, setSavedEngine] = React.useState(false);
    const [isSavingEmail, setIsSavingEmail] = React.useState(false);
    const [isSavingEngine, setIsSavingEngine] = React.useState(false);
    const [saved, setSaved] = React.useState(false);

    const [certStatus, setCertStatus] = React.useState<{
        hasCert?: boolean;
        expiry?: string;
        issuer?: string;
        subject?: string;
        thumbprint?: string;
        daysRemaining?: number;
        isValid?: boolean;
        error?: string;
    } | null>(null);

    const [toast, setToast] = React.useState<{ message: string; variant: 'success' | 'destructive' | 'info'; title?: string } | null>(null);

    const showToast = (message: string, variant: 'success' | 'destructive' | 'info' = 'success', title?: string) => {
        setToast({ message, variant, title });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchCertStatus = async () => {
        try {
            const response = await fetch('/api/certs/status');
            if (response.ok) {
                const data = await response.json();
                setCertStatus(data);
            }
        } catch (error) {
            console.error("Error fetching cert status:", error);
        }
    };

    React.useEffect(() => {
        fetchCertStatus();
    }, []);

    const handleChange = (field: keyof AppSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    // Sync with parent settings (external updates/refreshes)
    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSaveSection = async (section: 'email' | 'engine') => {
        const isEmail = section === 'email';
        const setSavedState = isEmail ? setSavedEmail : setSavedEngine;
        const setLoadingState = isEmail ? setIsSavingEmail : setIsSavingEngine;

        setLoadingState(true);
        try {
            // 1. Fetch current server state to avoid overwriting unrelated fields
            const response = await fetch('/api/config');
            if (!response.ok) throw new Error("Could not fetch latest configuration");
            const serverConfig = await response.json();

            // 2. Define which keys belong to which section
            const emailKeys = ['emailNotifications', 'recipientEmail', 'smtpServer', 'smtpPort', 'smtpUser', 'smtpPassword'];
            const engineKeys = ['checkInterval', 'autoRestart', 'maxRetries'];
            const keysToSync = isEmail ? emailKeys : engineKeys;

            // 3. Merge only those keys into the server config from current UI state
            const mergedConfig = { ...serverConfig };
            keysToSync.forEach(key => {
                if ((localSettings as any)[key] !== undefined) {
                    (mergedConfig as any)[key] = (localSettings as any)[key];
                }
            });

            // 4. Save merged config
            const saveRes = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mergedConfig),
            });

            if (saveRes.ok) {
                setSavedState(true);
                // Also update parent state if necessary, or just rely on server sync
                onSave(mergedConfig);
                showToast(`${isEmail ? "Email" : "Engine"} settings synchronized.`, "success", "Configuration Updated");
                setTimeout(() => setSavedState(false), 2000);
            } else {
                showToast("Failed to save configuration", "destructive", "Sync Error");
            }
        } catch (error) {
            console.error(`Error saving ${section} configuration:`, error);
            showToast("An error occurred during save.", "destructive", "Error");
        } finally {
            setLoadingState(false);
        }
    };

    const [isRegenerating, setIsRegenerating] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const handleRegenerateCerts = async () => {
        setIsRegenerating(true);
        try {
            // 1. Fetch AUTHORITATIVE config from server to avoid saving local drafts of other sections
            const configRes = await fetch('/api/config');
            if (!configRes.ok) throw new Error("Could not fetch latest server configuration");
            const serverConfig = await configRes.json();

            // 2. Password Selection
            let effectivePass = localSettings.certPassword?.trim();
            let passwordWasAutoGenerated = false;

            if (!effectivePass) {
                // Generate new 16-char strong rotation password (guaranteed Enterprise)
                const lower = "abcdefghijklmnopqrstuvwxyz";
                const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                const numbers = "0123456789";
                const symbols = "!@#$%^&*()_+";
                const allChars = lower + upper + numbers + symbols;

                let newPass = "";
                newPass += upper.charAt(Math.floor(Math.random() * upper.length));
                newPass += numbers.charAt(Math.floor(Math.random() * numbers.length));
                newPass += symbols.charAt(Math.floor(Math.random() * symbols.length));
                for (let i = 0; i < 13; i++) {
                    newPass += allChars.charAt(Math.floor(Math.random() * allChars.length));
                }
                newPass = newPass.split('').sort(() => 0.5 - Math.random()).join('');
                effectivePass = newPass;
                passwordWasAutoGenerated = true;
            }

            // 3. Prepare ISOLATED update (Only security fields from UI + effective password)
            const isolatedUpdate = {
                ...serverConfig,
                certPassword: effectivePass,
                certValidityDays: localSettings.certValidityDays,
                autoRenewCert: localSettings.autoRenewCert
            };

            // 4. Save ISOLATED configuration
            const saveResponse = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isolatedUpdate),
            });

            if (!saveResponse.ok) throw new Error("Failed to sync password before rotation");

            // 5. Update UI state if we auto-generated
            if (passwordWasAutoGenerated) {
                setLocalSettings(prev => ({ ...prev, certPassword: effectivePass }));
            }

            // 6. Trigger FORCED regeneration
            const response = await fetch('/api/certs/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: true })
            });

            if (response.ok) {
                const msg = passwordWasAutoGenerated
                    ? "Certificate and NEW auto-generated Password applied."
                    : "Certificate regenerated using your specified password.";
                showToast(msg, "success", "Manual Rotation Complete");

                // 7. Update parent state to sync the new password and config globally
                onSave(isolatedUpdate);

                // 8. Refresh visual cert details
                await fetchCertStatus();
            } else {
                showToast("Could not regenerate certificate. Check system logs.", "destructive", "Task Failed");
            }
        } catch (error) {
            console.error("Error regenerating certificates:", error);
            showToast("An error occurred during isolated certificate rotation.", "destructive", "Error");
        } finally {
            setIsRegenerating(false);
        }
    };

    const validitySteps = [1, 7, 14, 30, 90, 180, 365, 730, 1095, 1460, 1825, 2190, 2555, 2920, 3285, 3650];
    const getValidityLabel = (days: number) => {
        if (days === 1) return "1D";
        if (days === 7) return "7D";
        if (days === 14) return "14D";
        if (days === 30) return "30D";
        if (days === 90) return "3M";
        if (days === 180) return "6M";
        if (days % 365 === 0) return `${days / 365}Y`;
        return `${days} Days`;
    };
    const currentStepIndex = validitySteps.indexOf(localSettings.certValidityDays) !== -1
        ? validitySteps.indexOf(localSettings.certValidityDays)
        : 6; // Default to 1Y (index 6: 365 days) if not found

    const getPWStrength = (pw: string) => {
        if (!pw) return { score: 0, label: 'No Password', color: 'bg-slate-800', textColor: 'text-slate-500' };
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;

        if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
        if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500' };
        if (score === 3) return { score: 3, label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-500' };
        return { score: 4, label: 'Enterprise', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
    };

    const pwStrength = getPWStrength(localSettings.certPassword || '');

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in text-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Email Settings */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 bg-slate-950/30">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500/10 p-2.5 rounded-xl">
                                <Mail size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <CardTitle className="text-sm">Email Notifications</CardTitle>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Alert relay configuration</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant={savedEmail ? "success" : "secondary"}
                            onClick={() => handleSaveSection('email')}
                            disabled={isSavingEmail}
                            className="h-8 px-4 text-[9px] font-black uppercase tracking-widest border-blue-500/20 hover:bg-blue-500/10 transition-all font-bold flex items-center gap-1.5"
                        >
                            {isSavingEmail ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : savedEmail ? (
                                <CheckCircle2 size={12} />
                            ) : (
                                <Save size={12} />
                            )}
                            {isSavingEmail ? "Syncing..." : savedEmail ? "Updated" : "Save"}
                        </Button>
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
                    <CardHeader className="flex flex-row items-center justify-between gap-4 bg-slate-950/30">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-500/10 p-2.5 rounded-xl">
                                <Shield size={20} className="text-green-500" />
                            </div>
                            <div>
                                <CardTitle className="text-sm">Monitoring Engine</CardTitle>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Internal threshold logic</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant={savedEngine ? "success" : "secondary"}
                            onClick={() => handleSaveSection('engine')}
                            disabled={isSavingEngine}
                            className="h-8 px-4 text-[9px] font-black uppercase tracking-widest border-blue-500/20 hover:bg-blue-500/10 transition-all font-bold flex items-center gap-1.5"
                        >
                            {isSavingEngine ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : savedEngine ? (
                                <CheckCircle2 size={12} />
                            ) : (
                                <Save size={12} />
                            )}
                            {isSavingEngine ? "Syncing..." : savedEngine ? "Updated" : "Save"}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="mb-0 flex items-center gap-2">
                                    <Clock size={14} className="text-green-500" />
                                    Check Interval
                                </Label>
                                <Badge variant="success" animate className="!border-none">
                                    {localSettings.checkInterval}s
                                </Badge>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={localSettings.checkInterval}
                                onChange={(e) => handleChange('checkInterval', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
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
                                                ? '!bg-[rgba(59,130,246,0.1)] !border-[rgba(59,130,246,0)] !text-green-400 shadow-[0_0_5px_rgba(59,130,246,0.1)]'
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

                {/* Security Settings */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center !justify-start gap-4 bg-slate-950/30">
                        <div className="bg-amber-500/10 p-2.5 rounded-xl">
                            <Lock size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">Security & Certificates</CardTitle>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SSL and data protection</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="mb-0 flex items-center gap-2">
                                        <Clock size={14} className="text-amber-500" />
                                        Certificate Validity
                                    </Label>
                                    <Badge
                                        variant="warning"
                                        animate
                                        className="!bg-amber-500/10 !text-amber-400 !border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] !border-none"
                                    >
                                        {getValidityLabel(localSettings.certValidityDays || 365)}
                                    </Badge>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="range"
                                        min="0"
                                        max={validitySteps.length - 1}
                                        step="1"
                                        value={currentStepIndex}
                                        onChange={(e) => handleChange('certValidityDays', validitySteps[parseInt(e.target.value)])}
                                        className="relative w-full h-2 bg-slate-800/50 rounded-lg appearance-none cursor-pointer accent-amber-500 z-10"
                                    />
                                </div>
                            </div>

                            {/* Live Cert Status Card */}
                            {certStatus && certStatus.hasCert && (
                                <div className="mt-4 p-4 rounded-xl bg-slate-950/50 space-y-3 animate-fade-in">
                                    <div className="flex items-center justify-between pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Certificate Info</span>
                                            <button
                                                onClick={fetchCertStatus}
                                                className="text-slate-500 hover:text-slate-300 transition-colors"
                                                title="Refresh Status"
                                            >
                                                <RotateCcw size={12} />
                                            </button>
                                        </div>
                                        <Badge
                                            variant={certStatus.isValid ? "success" : "danger"}
                                            animate={certStatus.isValid}
                                            className={certStatus.isValid ? '!bg-green-500/10 !text-green-500 !border-none' : '!bg-red-500/10 !text-red-400 !border-none'}
                                        >
                                            {certStatus.isValid ? "ACTIVE" : "EXPIRED / INVALID"}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Expiration Date</p>
                                            <p className="text-xs font-mono font-bold text-slate-300 mt-1">{certStatus.expiry?.split(' ')[0] || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Time Remaining</p>
                                            <p className={`text-xs font-mono font-bold mt-1 text-slate-300`}>
                                                {certStatus.daysRemaining} {certStatus.daysRemaining === 1 ? 'Day' : 'Days'}
                                            </p>
                                        </div>
                                    </div>

                                    {certStatus.error && (
                                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                            <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest">
                                                Error: {certStatus.error}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl">
                                <div>
                                    <Label className="mb-0">Auto-Renewal</Label>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Renew before expiration</p>
                                </div>
                                <Switch
                                    checked={localSettings.autoRenewCert}
                                    onChange={async (checked) => {
                                        handleChange('autoRenewCert', checked);
                                        try {
                                            const configRes = await fetch('/api/config');
                                            if (!configRes.ok) throw new Error("Could not fetch server configuration");
                                            const serverConfig = await configRes.json();

                                            const isolatedUpdate = { ...serverConfig, autoRenewCert: checked };
                                            const saveResponse = await fetch('/api/config', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(isolatedUpdate),
                                            });

                                            if (saveResponse.ok) {
                                                onSave(isolatedUpdate);
                                                showToast(checked ? "Auto-Renewal Activated." : "Auto-Renewal Deactivated.", "success", "Configuration Saved");
                                            } else {
                                                throw new Error("Failed saving setting");
                                            }
                                        } catch (error) {
                                            console.error("Error saving auto-renewal setting:", error);
                                            showToast("Could not save Auto-Renewal setting.", "destructive", "Sync Error");
                                        }
                                    }}
                                    variant="warning"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Key size={14} className="text-amber-400" />
                                    Certificate Password
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={localSettings.certPassword || ''}
                                        onChange={(e) => handleChange('certPassword', e.target.value)}
                                        placeholder="Enter password..."
                                        className="flex-1 font-mono"
                                    />
                                    <Button
                                        variant="primary"
                                        className="px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide Password" : "Show Password"}
                                    >
                                        {showPassword ? <Lock size={14} /> : <Shield size={14} />}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="px-3"
                                        onClick={() => {
                                            const lower = "abcdefghijklmnopqrstuvwxyz";
                                            const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                                            const numbers = "0123456789";
                                            const symbols = "!@#$%^&*()_+";
                                            const allChars = lower + upper + numbers + symbols;

                                            let newPass = "";
                                            newPass += upper.charAt(Math.floor(Math.random() * upper.length));
                                            newPass += numbers.charAt(Math.floor(Math.random() * numbers.length));
                                            newPass += symbols.charAt(Math.floor(Math.random() * symbols.length));
                                            for (let i = 0; i < 13; i++) {
                                                newPass += allChars.charAt(Math.floor(Math.random() * allChars.length));
                                            }
                                            newPass = newPass.split('').sort(() => 0.5 - Math.random()).join('');
                                            handleChange('certPassword', newPass);
                                        }}
                                        title="Generate New Password"
                                    >
                                        <RotateCcw size={14} />
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex gap-1 h-1">
                                        {[1, 2, 3, 4].map((s) => (
                                            <div
                                                key={s}
                                                className={`flex-1 rounded-full transition-all duration-500 ${s <= pwStrength.score ? pwStrength.color : 'bg-slate-800'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">
                                            Saved to local storage and system config.
                                        </p>
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${pwStrength.textColor}`}>
                                            {pwStrength.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <Button
                                    variant="primary"
                                    onClick={handleRegenerateCerts}
                                    disabled={isRegenerating}
                                    className="w-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all"
                                >
                                    {isRegenerating ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Shield size={14} className="text-white" />
                                    )}
                                    {isRegenerating ? "Regenerating..." : "Regenerate Manual Certificate"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    variant={toast.variant as any}
                    title={toast.title}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};
