import * as React from "react";
import { type HTMLMotionProps } from "framer-motion";
declare const Card: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;
type MotionCardProps = Omit<HTMLMotionProps<"div">, "ref">;
declare const MotionCard: React.ForwardRefExoticComponent<
  MotionCardProps & React.RefAttributes<HTMLDivElement>
>;
declare const CardHeader: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;
declare const CardTitle: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;
declare const CardDescription: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;
declare const CardContent: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;
declare const CardFooter: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;
export {
  Card,
  MotionCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
