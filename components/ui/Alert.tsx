import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, AlertTriangle } from 'lucide-react';

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: AlertVariant;
    title?: string;
    icon?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
    default: 'bg-slate-900/50 border-slate-800 text-slate-200 shadow-slate-900/10',
    destructive: 'bg-red-950/20 border-red-500/30 text-red-200 shadow-red-900/10 [&>svg]:text-red-500',
    success: 'bg-green-950/20 border-green-500/30 text-green-200 shadow-green-900/10 [&>svg]:text-green-500',
    warning: 'bg-amber-950/20 border-amber-500/30 text-amber-200 shadow-amber-900/10 [&>svg]:text-amber-500',
    info: 'bg-blue-950/20 border-blue-500/30 text-blue-200 shadow-blue-900/10 [&>svg]:text-blue-500',
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
    default: <Info size={18} />,
    destructive: <XCircle size={18} />,
    success: <CheckCircle2 size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className = '', variant = 'default', title, icon, children, ...props }, ref) => {
        const Icon = icon || defaultIcons[variant];

        return (
            <div
                ref={ref}
                role="alert"
                className={`
                    relative w-full rounded-xl border p-4 shadow-lg backdrop-blur-sm
                    flex items-start gap-3 transition-all duration-300 animate-fade-in
                    ${variantStyles[variant]}
                    ${className}
                `}
                {...props}
            >
                <div className="mt-0.5 shrink-0 animate-pulse-slow">
                    {Icon}
                </div>
                <div className="flex-1 space-y-1">
                    {title && (
                        <h5 className="font-black uppercase tracking-tight text-sm leading-none mb-1">
                            {title}
                        </h5>
                    )}
                    <div className="text-xs font-medium opacity-90 leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        );
    }
);

Alert.displayName = 'Alert';
