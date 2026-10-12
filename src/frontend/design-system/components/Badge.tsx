import type { ComponentProps } from "react";

type BadgeTone = "neutral" | "primary" | "outline";

export type BadgeProps = ComponentProps<"span"> & {
  /** neutral: fundo cinza. primary: Tiffany. outline: só borda. */
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, string> = {
  neutral: "bg-muted text-foreground",
  primary: "bg-primary text-primary-foreground",
  outline: "border border-input text-foreground",
};

/** Etiqueta curta para status ou categoria. */
export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
