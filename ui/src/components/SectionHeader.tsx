import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    className?: string;
    actions?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    description,
    icon: Icon,
    className,
    actions
}) => {
    return (
        <div className={`flex items-center justify-between mb-4 ${className || ''}`}>
            <div className="flex items-center gap-2">
                {Icon && <Icon size={18} className="text-primary" />}
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-slate-500 dark:text-text-secondary mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
};
