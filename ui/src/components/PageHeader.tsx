import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    icon: Icon,
    actions,
    className
}) => {
    return (
        <div className={`flex flex-row md:flex-row md:items-center justify-between gap-4 mb-8 ${className || ''}`}>
            <div className="flex items-start gap-4">
                {Icon && (
                    <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Icon size={24} />
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-slate-500 dark:text-text-secondary font-medium">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};
