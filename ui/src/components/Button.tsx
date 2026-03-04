import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import type { LucideIcon } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import './components.css';

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

/**
 * Shared logic for rendering a button with an optional custom component
 */
const renderButtonContent = (
    loading: boolean,
    Icon: LucideIcon | undefined,
    iconPosition: 'left' | 'right',
    size: string,
    children: React.ReactNode
) => (
    <>
        {loading && <RefreshCw size={size === 'sm' ? 14 : 16} className="spin mr-2" />}
        {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 18} className="mr-2" />}
        <span className="btn-content">{children}</span>
        {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 18} className="ml-2" />}
    </>
);

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
        const finalClassName = `btn-standard btn-${variant} btn-size-${size} ${fullWidth ? 'w-full' : ''} ${className}`.trim();

        if (Component && Component !== 'button') {
            const FinalComp = Component as any;
            return (
                <FinalComp
                    ref={ref}
                    className={finalClassName}
                    disabled={disabled || loading}
                    {...props}
                >
                    {renderButtonContent(loading, Icon, iconPosition, size, children)}
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
                {renderButtonContent(loading, Icon, iconPosition, size, children)}
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
        const finalClassName = `btn-icon-standard btn-icon-${variant} btn-icon-size-${size} ${className}`.trim();

        const content = loading ? (
            <RefreshCw size={size === 'sm' ? 14 : 18} className="spin" />
        ) : (
            <Icon size={size === 'sm' ? 16 : 20} />
        );

        if (Component && Component !== 'button') {
            const FinalComp = Component as any;
            return (
                <FinalComp
                    ref={ref}
                    className={finalClassName}
                    disabled={disabled || loading}
                    {...props}
                >
                    {content}
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
                {content}
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
