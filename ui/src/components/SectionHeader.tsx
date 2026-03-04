import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Heading, Text } from './Typography';

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
                    <Heading level={3} className="text-slate-900 dark:text-white">
                        {title}
                    </Heading>
                    {description && (
                        <Text as="p" variant="small" color="secondary" weight="medium" className="mt-0.5">
                            {description}
                        </Text>
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
