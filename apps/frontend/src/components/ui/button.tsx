"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-wide transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-arcade btn-arcade-primary",
        secondary: "btn-arcade btn-arcade-secondary",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 rounded-lg",
        outline: "btn-arcade btn-arcade-secondary",
        ghost: "btn-arcade-ghost rounded-lg px-4 py-2",
        link: "text-nc-neon-green underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3 text-sm rounded-lg",
        sm: "h-9 px-4 py-2 text-xs rounded-md",
        lg: "h-14 px-10 py-4 text-base rounded-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// Animated button with Framer Motion for enhanced skeuomorphic feel
interface MotionButtonProps
  extends
    Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {}

const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98, y: 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      />
    );
  },
);
MotionButton.displayName = "MotionButton";

export { Button, MotionButton, buttonVariants };
