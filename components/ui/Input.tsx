import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input: React.FC<InputProps> = ({ error, className = '', ...props }) => (
    <div className="space-y-1.5 flex-1">
        <input
            style={{ outline: 'none' }}
            className={`w-full bg-slate-800/20 border border-transparent rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent focus:bg-[rgba(59,130,246,0.1)] focus:text-blue-400 focus:shadow-[0_0_5px_rgba(59,130,246,0.1)] transition-all ${className} ${error ? '!border-red-500/50' : ''}`}
            {...props}
        />
        {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{error}</p>}
    </div>
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, className = '', ...props }) => (
    <label className={`block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ${className}`} {...props}>
        {children}
    </label>
);
