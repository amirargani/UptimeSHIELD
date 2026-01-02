import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all !outline-none !ring-0 focus:!outline-none focus:!ring-0 disabled:opacity-50 disabled:pointer-events-none active:scale-95';

    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border border-blue-500/20',
        secondary: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:shadow-[0_0_5px_rgba(59,130,246,0.2)]',
        destructive: 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20',
        success: 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 border border-green-500/20',
        outline: 'bg-transparent border border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_5px_rgba(59,130,246,0.2)]',
        ghost: 'bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
        icon: 'p-2',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {children}
        </button>
    );
};
