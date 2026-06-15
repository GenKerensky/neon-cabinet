import * as React from "react";
import { Slider } from "./ui/slider";
import { cn } from "../lib/utils";

function GradientSlider({
  className,
  ...props
}: React.ComponentProps<typeof Slider>) {
  return (
    <Slider
      className={cn(
        "gradient-slider [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-[linear-gradient(90deg,#66ffff,#ff64d8)] [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-[#66ffff] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-[0_0_18px_rgba(102,255,255,0.46)]",
        className,
      )}
      {...props}
    />
  );
}

export { GradientSlider };
