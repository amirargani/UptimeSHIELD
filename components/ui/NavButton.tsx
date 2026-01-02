import React from 'react';

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

export const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between group px-5 py-4 rounded-xl transition-all duration-300 ${active
            ? 'bg-blue-600/10 text-white border border-transparent shadow-lg shadow-blue-900/1'
            : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
            }`}
    >
        <div className="flex items-center gap-4">
            <span className={`transition-transform duration-500 ${active ? 'scale-110 text-blue-500' : 'group-hover:scale-110'}`}>
                {icon}
            </span>
            <span className={`text-xs font-black uppercase tracking-[0.15em] ${active ? 'text-slate-100' : ''}`}>{label}</span>
        </div>
        {active && (
            <div className="w-2 h-2 rounded-full bg-green-600 shadow-[0_0_5px_2px_rgba(59,130,246,0.6)] ring-1 ring-green-400/50" />
        )}
    </button>
);
