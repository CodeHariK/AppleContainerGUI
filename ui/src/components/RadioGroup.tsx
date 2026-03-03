import * as React from 'react';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';

interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof BaseRadioGroup> {
    label?: string;
    children?: React.ReactNode;
    className?: string;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
    ({ label, children, className, ...props }, ref) => {
        return (
            <BaseRadioGroup
                ref={ref}
                className={`flex flex-col gap-3 ${className || ''}`}
                {...props}
            >
                {label && (
                    <span className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                        {label}
                    </span>
                )}
                {children}
            </BaseRadioGroup>
        );
    }
);

interface RadioProps extends React.ComponentPropsWithoutRef<typeof BaseRadio.Root> {
    label: string;
    description?: string;
    value: string;
}

export const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(
    ({ label, description, className, ...props }, ref) => {
        return (
            <BaseRadio.Root
                ref={ref}
                className={`
                    group relative flex cursor-pointer rounded-xl border border-slate-200 dark:border-surface-border 
                    bg-slate-50 dark:bg-surface-dark p-4 shadow-sm focus:outline-none 
                    hover:border-primary/50 transition-all 
                    data-[checked]:border-primary
                    ${className || ''}
                `}
                {...props}
            >
                <span className="flex flex-1">
                    <span className="flex flex-col text-left">
                        <span className="block text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                            {label}
                        </span>
                        {description && (
                            <span className="mt-1 flex items-center text-xs text-slate-500 dark:text-text-secondary">
                                {description}
                            </span>
                        )}
                    </span>
                </span>
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-colors group-hover:border-primary group-data-[checked]:border-transparent group-data-[checked]:bg-primary mt-0.5">
                    <div className="size-2 rounded-full bg-white scale-0 transition-transform group-data-[checked]:scale-100" />
                </div>
                <div className="pointer-events-none absolute -inset-px rounded-xl border-2 border-transparent group-data-[checked]:border-primary transition-colors" />
            </BaseRadio.Root>
        );
    }
);

RadioGroup.displayName = 'RadioGroup';
Radio.displayName = 'Radio';
