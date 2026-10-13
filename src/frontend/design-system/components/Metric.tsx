import type { ReactNode } from "react";
import { InfoTooltip } from "@/frontend/design-system/components/InfoTooltip";

type MetricProps = {
  label: string;
  /** O número já formatado. */
  value: ReactNode;
  /** Como o número é calculado (abre no ícone ⓘ). */
  info?: ReactNode;
  /** Linha de apoio: variação, porcentagem, aviso. */
  children?: ReactNode;
};

/** Rótulo, número grande e uma linha de apoio. A seta fica só na comparação, nunca no número. */
export function Metric({ label, value, info, children }: MetricProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        {label}
        {info && <InfoTooltip label={`Como calculamos: ${label}`}>{info}</InfoTooltip>}
      </span>
      <span className="font-display text-3xl font-semibold tabular-nums">{value}</span>
      {children}
    </div>
  );
}
