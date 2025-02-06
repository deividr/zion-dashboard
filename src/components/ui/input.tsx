import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  icon?: JSX.ElementType;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    const Icon = icon;
    return (
      <div className="relative group">
        {Icon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Icon className="w-5 h-5 text-zinc-400 transition-colors group-hover:text-zinc-500" />
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-base",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-zinc-400",
            "shadow-sm hover:shadow-md",
            "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50",
            Icon ? "pl-10" : "",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
