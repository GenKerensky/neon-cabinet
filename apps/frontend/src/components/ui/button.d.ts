import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { type HTMLMotionProps } from "framer-motion";
declare const buttonVariants: (
  props?:
    | ({
        variant?:
          | "default"
          | "link"
          | "outline"
          | "secondary"
          | "destructive"
          | "ghost"
          | null
          | undefined;
        size?: "default" | "icon" | "sm" | "lg" | null | undefined;
      } & import("class-variance-authority/types").ClassProp)
    | undefined,
) => string;
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;
interface MotionButtonProps
  extends
    Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {}
declare const MotionButton: React.ForwardRefExoticComponent<
  MotionButtonProps & React.RefAttributes<HTMLButtonElement>
>;
export { Button, MotionButton, buttonVariants };
