import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={`bg-slate-900/50 rounded-xl overflow-hidden backdrop-blur-sm ${className}`}>
        {children}
    </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={`px-6 py-4 flex items-center justify-between ${className}`}>
        {children}
    </div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
    <h3 className={`text-sm font-semibold text-slate-200 uppercase tracking-wider ${className}`}>
        {children}
    </h3>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);
