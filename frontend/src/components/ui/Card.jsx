import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow-sm bg-white", className)} {...props} />
));
Card.displayName = "Card";
