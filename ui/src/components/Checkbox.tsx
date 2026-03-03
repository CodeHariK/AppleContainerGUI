import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof BaseCheckbox.Root> {
    label?: string;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
    ({ label, className, ...props }, ref) => {
        return (
            <label className="flex items-center gap-3 cursor-pointer group select-none">
                <BaseCheckbox.Root
                    ref={ref}
                    className={`
                        flex size-5 items-center justify-center rounded border transition-all
                        border-slate-300 dark:border-surface-border
                        bg-white dark:bg-surface-dark
                        data-[checked]:bg-primary data-[checked]:border-primary
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${className || ''}
                    `}
                    {...props}
                >
                    <BaseCheckbox.Indicator className="flex items-center justify-center text-white">
                        <Check size={14} strokeWidth={3} />
                    </BaseCheckbox.Indicator>
                </BaseCheckbox.Root>
                {label && (
                    <span className="text-sm text-slate-600 dark:text-text-secondary group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {label}
                    </span>
                )}
            </label>
        );
    }
);

Checkbox.displayName = 'Checkbox';
