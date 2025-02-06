import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:scale-[0.98] active:scale-[0.97]",
        destructive:
          "bg-red-500 text-white shadow-md hover:bg-red-600 hover:scale-[0.98] active:scale-[0.97]",
        outline:
          "border-2 border-orange-200 bg-orange-50 text-orange-700 shadow-sm hover:border-orange-500",
        secondary:
          "bg-green-500 text-white shadow-md hover:bg-green-600 hover:scale-[0.98] active:scale-[0.97]",
        ghost: "hover:bg-orange-100 hover:text-orange-700 transition-colors",
        link: "text-orange-500 underline-offset-4 hover:underline decoration-2",
        gradient:
          "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md hover:opacity-90 hover:scale-[0.98] active:scale-[0.97]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-10 rounded-md px-4 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
