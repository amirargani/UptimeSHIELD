import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
    className?: string;
    animate?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'neutral',
    className = '',
    animate = false
}) => {
    const baseStyles = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border';

    const variants = {
        success: 'bg-green-500/10 text-green-400 border-green-500/20',
        danger: 'bg-red-500/10 text-red-400 border-red-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        neutral: 'bg-slate-800/50 text-slate-400 border-slate-700',
    };

    const animationClass = animate ? 'animate-pulse' : '';

    return (
        <span className={`${baseStyles} ${variants[variant]} ${animationClass} ${className}`}>
            {animate && (
                <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
            )}
            {children}
        </span>
    );
};
