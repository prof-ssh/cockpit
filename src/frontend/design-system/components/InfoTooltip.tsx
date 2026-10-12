"use client";

import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/frontend/design-system/components/ui/tooltip";

type InfoTooltipProps = {
  /** Nome lido pelo leitor de tela, ex.: "Como calculamos: Entradas". */
  label: string;
  children: ReactNode;
};

/** Ícone ⓘ que explica um número. Abre no mouse, no foco do teclado ou no toque. */
export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const [aberto, setAberto] = useState(false);
  return (
    <Tooltip open={aberto} onOpenChange={setAberto}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => setAberto((a) => !a)}
          className="inline-flex rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Info className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="w-72 max-w-[calc(100vw-2rem)] text-left text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
