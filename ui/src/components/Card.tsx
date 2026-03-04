import * as React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'accent' | 'glass';
    hoverable?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ children, variant = 'default', hoverable = false, padding = 'md', className, ...props }, ref) => {
        const variants = {
            default: 'bg-white dark:bg-surface-dark',
            accent: 'bg-white dark:bg-surface-dark shadow-primary/5',
            glass: 'bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md'
        };

        const paddings = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8'
        };

        return (
            <div
                ref={ref}
                className={`
                    rounded-xl shadow-sm transition-all duration-200
                    ${variants[variant]}
                    ${paddings[padding]}
                    ${hoverable ? 'hover:shadow-md hover:border-primary/30 cursor-pointer' : ''}
                    ${className || ''}
                `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
