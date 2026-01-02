import React from 'react';
import { Alert } from './Alert';

interface ToastProps {
    message: string;
    variant: 'default' | 'destructive' | 'success' | 'warning' | 'info';
    title?: string;
    onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, variant, title }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] w-full max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
            <Alert
                variant={variant}
                title={title}
                className="shadow-2xl border-l-4 backdrop-blur-md"
            >
                {message}
            </Alert>
        </div>
    );
};
