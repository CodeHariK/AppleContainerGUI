import * as React from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { Text } from './Typography';

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof BaseSwitch.Root> {
    label?: string;
    description?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ label, description, className, ...props }, ref) => {
        return (
            <label className="flex items-center gap-3 cursor-pointer group select-none">
                <BaseSwitch.Root
                    ref={ref}
                    className={`
                        relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full 
                        bg-slate-200 dark:bg-slate-700 
                        transition-colors duration-200 
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 
                        data-[checked]:bg-primary 
                        disabled:cursor-not-allowed disabled:opacity-50
                        ${className || ''}
                    `}
                    {...props}
                >
                    <BaseSwitch.Thumb
                        className="
                            pointer-events-none block h-5 w-5 rounded-full 
                            bg-white shadow-lg ring-0 
                            transition-transform duration-200 
                            data-[checked]:translate-x-5 data-[unchecked]:translate-x-0.5
                        "
                    />
                </BaseSwitch.Root>
                {(label || description) && (
                    <div className="flex flex-col">
                        {label && (
                            <Text variant="small" weight="medium" className="group-hover:text-primary transition-colors">
                                {label}
                            </Text>
                        )}
                        {description && (
                            <Text variant="xs" color="secondary">
                                {description}
                            </Text>
                        )}
                    </div>
                )}
            </label>
        );
    }
);

Switch.displayName = 'Switch';
