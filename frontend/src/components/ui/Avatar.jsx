import React from 'react';
import { cn } from '../../utils/cn';

export const Avatar = React.forwardRef(({ className, src, fallback, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100", className)} {...props}>
      {src ? <img className="aspect-square h-full w-full object-cover" src={src} alt="" /> : <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-500 font-semibold">{fallback}</div>}
    </div>
  )
});
Avatar.displayName = "Avatar";
