import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import type { LucideIcon } from 'lucide-react';
import { RefreshCw } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass' | 'dangerGhost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    as?: React.ElementType;
    to?: string; // For use with Link
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        variant = 'primary',
        size = 'md',
        loading = false,
        icon: Icon,
        iconPosition = 'left',
        fullWidth = false,
        className = '',
        children,
        disabled,
        as: Component,
        ...props
    }, ref) => {
        const baseClass = 'btn-standard';
        const variantClass = `btn-${variant}`;
        const sizeClass = `btn-size-${size}`;
        const widthClass = fullWidth ? 'w-full' : '';
        const finalClassName = `${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

        // If it's a primitive or custom component like Link, we might want to skip BaseButton's logic
        // but for now let's try to use BaseButton's 'render' if it's a native element, 
        // or just render the component manually if it's a Link to avoid semantic conflict as per Base UI docs.
        if (Component && Component !== 'button') {
            const FinalComp = Component as any;
            return (
                <FinalComp
                    ref={ref}
                    className={finalClassName}
                    disabled={disabled || loading}
                    {...props}
                >
                    {loading && <RefreshCw size={size === 'sm' ? 14 : 16} className="spin mr-2" />}
                    {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 18} className="mr-2" />}
                    <span className="btn-content">{children}</span>
                    {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 18} className="ml-2" />}
                </FinalComp>
            );
        }

        return (
            <BaseButton
                ref={ref}
                disabled={disabled || loading}
                className={finalClassName}
                {...props}
            >
                {loading && <RefreshCw size={size === 'sm' ? 14 : 16} className="spin mr-2" />}
                {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 18} className="mr-2" />}
                <span className="btn-content">{children}</span>
                {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 18} className="ml-2" />}
            </BaseButton>
        );
    }
);

Button.displayName = 'Button';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    variant?: 'ghost' | 'glass' | 'danger' | 'primary' | 'secondary' | 'dangerGhost';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    loading?: boolean;
    as?: React.ElementType;
    to?: string; // For use with Link
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({
        icon: Icon,
        variant = 'ghost',
        size = 'md',
        loading = false,
        className = '',
        disabled,
        as: Component,
        ...props
    }, ref) => {
        const baseClass = 'btn-icon-standard';
        const variantClass = `btn-icon-${variant}`;
        const sizeClass = `btn-icon-size-${size}`;
        const finalClassName = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

        if (Component && Component !== 'button') {
            const FinalComp = Component as any;
            return (
                <FinalComp
                    ref={ref}
                    className={finalClassName}
                    disabled={disabled || loading}
                    {...props}
                >
                    {loading ? <RefreshCw size={size === 'sm' ? 14 : 18} className="spin" /> : <Icon size={size === 'sm' ? 16 : 20} />}
                </FinalComp>
            );
        }

        return (
            <BaseButton
                ref={ref}
                disabled={disabled || loading}
                className={finalClassName}
                {...props}
            >
                {loading ? <RefreshCw size={size === 'sm' ? 14 : 18} className="spin" /> : <Icon size={size === 'sm' ? 16 : 20} />}
            </BaseButton>
        );
    }
);

IconButton.displayName = 'IconButton';

const OutlineButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', ...props }, ref) => {
        return <Button ref={ref} variant="secondary" className={`btn-outline ${className}`} {...props} />;
    }
);

OutlineButton.displayName = 'OutlineButton';

export { Button, IconButton, OutlineButton };
export type { ButtonProps, IconButtonProps };
