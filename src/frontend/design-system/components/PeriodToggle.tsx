"use client";

import { ToggleGroup, ToggleGroupItem } from "@/frontend/design-system/components/ui/toggle-group";
import { cn } from "cn";

type PeriodToggleProps<T extends number> = {
  value: T;
  onValueChange: (value: T) => void;
  /** Nome do grupo para o leitor de tela, ex.: "Período do realizado". */
  label: string;
  options?: readonly T[];
  className?: string;
};

/** Escolha de período em dias (30 / 60 / 90), para o cabeçalho de um card. */
export function PeriodToggle<T extends number>({
  value,
  onValueChange,
  label,
  options = [30, 60, 90] as unknown as readonly T[],
  className,
}: PeriodToggleProps<T>) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label={label}
      value={String(value)}
      // O Radix manda "" ao clicar no item já marcado: o período nunca fica vazio.
      onValueChange={(v) => v && onValueChange(Number(v) as T)}
      className={cn("bg-background", className)}
    >
      {options.map((dias) => (
        <ToggleGroupItem
          key={dias}
          value={String(dias)}
          className="px-2.5 tabular-nums data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        >
          {dias} dias
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
