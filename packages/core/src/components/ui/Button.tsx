import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Button variants using class-variance-authority
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    '[[&_svg]:pointer-events-none_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-blue-600 text-white',
          'hover:bg-blue-700',
          'focus-visible:ring-blue-500',
          'dark:bg-blue-500 dark:hover:bg-blue-600',
        ],
        destructive: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'focus-visible:ring-red-500',
          'dark:bg-red-500 dark:hover:bg-red-600',
        ],
        outline: [
          'border border-gray-300 bg-white text-gray-700',
          'hover:bg-gray-50 hover:text-gray-900',
          'focus-visible:ring-gray-400',
          'dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300',
          'dark:hover:bg-slate-700 dark:hover:text-gray-100',
        ],
        secondary: [
          'bg-gray-100 text-gray-900',
          'hover:bg-gray-200',
          'focus-visible:ring-gray-400',
          'dark:bg-slate-700 dark:text-gray-100',
          'dark:hover:bg-slate-600',
        ],
        ghost: [
          'text-gray-700',
          'hover:bg-gray-100 hover:text-gray-900',
          'focus-visible:ring-gray-400',
          'dark:text-gray-300',
          'dark:hover:bg-slate-800 dark:hover:text-gray-100',
        ],
        link: [
          'text-blue-600 underline-offset-4',
          'hover:underline',
          'dark:text-blue-400',
        ],
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Button props
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child (Radix Slot) */
  asChild?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Left icon */
  leftIcon?: React.ReactNode;

  /** Right icon */
  rightIcon?: React.ReactNode;
}

/**
 * Button component with variants
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
