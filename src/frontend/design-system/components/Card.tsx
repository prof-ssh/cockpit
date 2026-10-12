import type { ComponentProps } from "react";

type CardTone = "default" | "muted" | "highlight";

export type CardProps = ComponentProps<"div"> & {
  /** default: com borda. muted: fundo cinza. highlight: fundo Tiffany suave. */
  tone?: CardTone;
};

const tones: Record<CardTone, string> = {
  default: "border border-border bg-background",
  muted: "bg-muted",
  highlight: "bg-primary-soft",
};

/** Bloco que agrupa conteúdo. Sem sombra: a marca separa com borda ou fundo. */
export function Card({ tone = "default", className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-md p-6 text-foreground ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

export type CardTitleProps = ComponentProps<"h3">;

/** Título do card, na fonte de títulos da marca. */
export function CardTitle({ className = "", ...props }: CardTitleProps) {
  return (
    <h3
      className={`font-display text-subheading font-semibold ${className}`}
      {...props}
    />
  );
}

export type CardDescriptionProps = ComponentProps<"p">;

/** Texto de apoio do card. */
export function CardDescription({ className = "", ...props }: CardDescriptionProps) {
  return <p className={`mt-2 text-sm text-muted-foreground ${className}`} {...props} />;
}
