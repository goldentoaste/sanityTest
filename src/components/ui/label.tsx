'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const labelVariants = cva(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
        VariantProps<typeof labelVariants> & { required?: boolean }
>(({ required = false, className, ...props }, ref) => (
    <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants(), className, {
            [`after:content-["*"] after:text-red-600 after:pl-1`]: required,
        })}
        {...props}
    />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
