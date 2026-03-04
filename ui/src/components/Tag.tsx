import React from 'react';
import './Tag.css';

interface TagProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'standard' | 'primary' | 'success' | 'danger' | 'warning';
}

export function Tag({ children, className = "", variant = "standard" }: TagProps) {
    return (
        <span className={`tag-standard tag-variant-${variant} ${className}`}>
            {children}
        </span>
    );
}
