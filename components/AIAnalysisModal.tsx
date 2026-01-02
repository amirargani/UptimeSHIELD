import React from 'react';
import { Bot, FileText, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    isLoading: boolean;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, content, isLoading }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gemini Diagnostics"
            maxWidth="2xl"
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-purple-600/5 border border-purple-500/10 rounded-xl">
                    <div className="bg-purple-600/20 p-2.5 rounded-lg shadow-lg shadow-purple-900/20">
                        <Bot size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight">AI Diagnostic Report</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Automated log analysis & troubleshooting</p>
                    </div>
                </div>

                <div className="text-slate-300 leading-relaxed min-h-[200px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-purple-500/10 rounded-full" />
                                <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 animate-pulse">Analyzing failure patterns...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                                components={{
                                    h1: ({ ...props }) => <h1 className="text-lg font-black text-purple-400 mb-6 uppercase tracking-tight border-b border-purple-500/10 pb-2" {...props} />,
                                    h2: ({ ...props }) => <h2 className="text-base font-bold text-slate-100 mt-8 mb-4 border-l-4 border-purple-500/40 pl-3" {...props} />,
                                    ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-3 text-slate-400" {...props} />,
                                    li: ({ ...props }) => <li className="marker:text-purple-500 font-medium" {...props} />,
                                    strong: ({ ...props }) => <strong className="text-slate-100 font-black tracking-tight" {...props} />,
                                    p: ({ ...props }) => <p className="mb-4 text-slate-400" {...props} />
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        <Activity size={12} className="text-purple-500" />
                        Analysis by Gemini 2.0 Flash
                    </span>
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="px-6 py-2 h-9 text-[10px] font-black uppercase tracking-[0.1em]"
                    >
                        Dismiss Report
                    </Button>
                </div>
            </div>
        </Modal>
    );
};