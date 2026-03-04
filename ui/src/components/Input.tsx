import * as React from 'react';
import { Input as BaseInput } from '@base-ui/react/input';
import type { LucideIcon } from 'lucide-react';
import { Label } from "./Typography";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon;
    containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon: Icon, className, containerClassName, ...props }, ref) => {
        return (
            <div className={`flex flex-col gap-1.5 w-full ${containerClassName || ''}`}>
                {label && (
                    <Label variant="xs" color="secondary" className="pl-1 leading-none">
                        {label}
                    </Label>
                )}
                <div className="relative group">
                    {Icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                            <Icon size={18} />
                        </div>
                    )}
                    <BaseInput
                        ref={ref}
                        className={`
              block w-full 
              ${Icon ? 'pl-10' : 'pl-3'} 
              pr-3 py-2.5 
              bg-white dark:bg-surface-dark 
              border border-slate-700 dark:border-surface-border 
              rounded-lg 
              leading-5 
              text-slate-900 dark:text-white 
              placeholder-slate-400 dark:placeholder-text-secondary 
              focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary 
              sm:text-sm 
              transition-all 
              shadow-sm
              ${className || ''}
            `}
                        {...props}
                    />
                </div>
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
