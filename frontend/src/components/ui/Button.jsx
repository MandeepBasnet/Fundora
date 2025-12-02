import React from 'react';
import { cn } from '../../utils/cn';

const buttonVariants = (variant = "default", size = "default") => {
  const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 cursor-pointer";
  const variants = {
    default: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
    link: "text-slate-900 underline-offset-4 hover:underline",
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9",
  };
  return cn(base, variants[variant], sizes[size]);
};

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants(variant, size), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
