import React from 'react';
import './Typography.css';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'xs';
    weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    color?: 'primary' | 'secondary' | 'muted' | 'accent';
    uppercase?: boolean;
    tracking?: 'tight' | 'tighter' | 'widest' | 'normal';
    background?: 'subtle' | 'primary' | 'accent' | 'success' | 'danger' | 'glass';
    className?: string;
    children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
    level = 1,
    variant,
    weight,
    color,
    uppercase = false,
    tracking,
    background,
    className = '',
    children,
    ...props
}) => {
    const Tag = `h${level}` as any;
    const baseClass = `heading-base heading-h${level}`;
    const classes = [
        baseClass,
        variant ? `heading-${variant}` : '',
        weight ? `font-${weight}` : '',
        color ? `text-${color}` : '',
        uppercase ? 'text-uppercase' : '',
        tracking ? `text-tracking-${tracking}` : '',
        background ? `text-bg-${background}` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <Tag className={classes} {...props}>
            {children}
        </Tag>
    );
};

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
    as?: 'p' | 'span' | 'div';
    variant?: 'body' | 'detail' | 'small' | 'xs';
    mono?: boolean;
    weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'danger' | 'success';
    uppercase?: boolean;
    tracking?: 'tight' | 'tighter' | 'widest' | 'normal';
    background?: 'subtle' | 'primary' | 'accent' | 'success' | 'danger' | 'glass';
    className?: string;
    children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
    as: Tag = 'span' as any,
    variant = 'body',
    mono = false,
    weight,
    color,
    uppercase = false,
    tracking,
    background,
    className = '',
    children,
    ...props
}) => {
    const CustomTag = Tag as any;
    const classes = [
        `text-${variant}`,
        mono ? 'text-mono' : '',
        weight ? `font-${weight}` : '',
        color ? `text-${color}` : '',
        uppercase ? 'text-uppercase' : '',
        tracking ? `text-tracking-${tracking}` : '',
        background ? `text-bg-${background}` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <CustomTag className={classes} {...props}>
            {children}
        </CustomTag>
    );
};

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    variant?: 'small' | 'body' | 'xs';
    weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    color?: 'primary' | 'secondary' | 'muted' | 'accent';
    uppercase?: boolean;
    tracking?: 'tight' | 'tighter' | 'widest' | 'normal';
    className?: string;
    children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
    variant = 'body',
    weight,
    color,
    uppercase = false,
    tracking,
    className = '',
    children,
    ...props
}) => {
    const classes = [
        'label-base',
        variant ? `text-${variant}` : '',
        weight ? `font-${weight}` : '',
        color ? `text-${color}` : '',
        uppercase ? 'text-uppercase' : '',
        tracking ? `text-tracking-${tracking}` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <label className={classes} {...props}>
            {children}
        </label>
    );
};

// Specialized Heading Components
export const H1: React.FC<Omit<HeadingProps, 'level'>> = (props) => <Heading level={1} {...props} />;
export const H2: React.FC<Omit<HeadingProps, 'level'>> = (props) => <Heading level={2} {...props} />;
export const H3: React.FC<Omit<HeadingProps, 'level'>> = (props) => <Heading level={3} {...props} />;
export const H4: React.FC<Omit<HeadingProps, 'level'>> = (props) => <Heading level={4} {...props} />;

// Specialized Text Components
export const P: React.FC<Omit<TextProps, 'as' | 'variant'>> = (props) => <Text as="p" variant="body" {...props} />;
export const Body: React.FC<Omit<TextProps, 'variant'>> = (props) => <Text variant="body" {...props} />;
export const Detail: React.FC<Omit<TextProps, 'variant'>> = (props) => <Text variant="detail" {...props} />;
export const Small: React.FC<Omit<TextProps, 'variant'>> = (props) => <Text variant="small" {...props} />;
export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => <Text variant="xs" {...props} />;
export const Code: React.FC<Omit<TextProps, 'mono'>> = (props) => <Text mono {...props} />;
