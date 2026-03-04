import React from 'react';
import './Table.css';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
    containerClassName?: string;
}

export function Table({ children, className = '', containerClassName = '', ...props }: TableProps) {
    return (
        <div className={`table-container custom-scrollbar ${containerClassName}`}>
            <table className={`table-standard ${className}`} {...props}>
                {children}
            </table>
        </div>
    );
}

export function Thead({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead className={`table-thead ${className}`} {...props}>
            {children}
        </thead>
    );
}

export function Tbody({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tbody className={`table-tbody ${className}`} {...props}>
            {children}
        </tbody>
    );
}

interface TrProps extends React.HTMLAttributes<HTMLTableRowElement> {
    hoverable?: boolean;
}

export function Tr({ children, className = '', hoverable = true, ...props }: TrProps) {
    return (
        <tr className={`table-tr ${hoverable ? 'table-tr-hover' : ''} ${className}`} {...props}>
            {children}
        </tr>
    );
}

export function Th({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th className={`table-th ${className}`} {...props}>
            {children}
        </th>
    );
}

export function Td({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={`table-td ${className}`} {...props}>
            {children}
        </td>
    );
}
