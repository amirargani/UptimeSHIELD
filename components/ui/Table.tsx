import React from 'react';

interface TableProps {
    children: React.ReactNode;
    className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => (
    <div className="w-full overflow-auto">
        <table className={`w-full text-left border-collapse ${className}`}>
            {children}
        </table>
    </div>
);

export const TableHeader: React.FC<TableProps> = ({ children, className = '' }) => (
    <thead className={`border-b border-slate-800 bg-slate-900/30 ${className}`}>
        {children}
    </thead>
);

export const TableBody: React.FC<TableProps> = ({ children, className = '' }) => (
    <tbody className={`divide-y divide-slate-800/50 ${className}`}>
        {children}
    </tbody>
);

export const TableRow: React.FC<TableProps> = ({ children, className = '' }) => (
    <tr className={`hover:bg-slate-800/30 transition-colors group ${className}`}>
        {children}
    </tr>
);

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '', ...props }) => (
    <th
        className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest ${className}`}
        {...props}
    >
        {children}
    </th>
);

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '', ...props }) => (
    <td
        className={`px-6 py-4 text-sm text-slate-300 ${className}`}
        {...props}
    >
        {children}
    </td>
);
