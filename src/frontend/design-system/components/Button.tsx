import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ComponentProps<"button"> & {
  /** primary: ação principal (Tiffany). secondary: com borda. ghost: só texto. */
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-sans font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/85",
  secondary: "border border-input bg-transparent text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-base",
};

/** Botão do design system. Use um só `primary` por área da tela. */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
