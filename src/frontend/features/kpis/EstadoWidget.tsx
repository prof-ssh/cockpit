"use client";

import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/frontend/design-system/components/ui/button";
import { cn } from "@/frontend/design-system/lib/utils";
import type { EstadoDados } from "./use-dados";

type EstadoWidgetProps<T> = {
  estado: EstadoDados<T>;
  /** Altura do esqueleto enquanto carrega pela primeira vez (classe do Tailwind). */
  altura?: string;
  /** Quando os dados chegaram mas não há o que mostrar. */
  vazio?: (dados: T) => boolean;
  mensagemVazio?: ReactNode;
  children: (dados: T) => ReactNode;
};

/** Carregando, erro, sem dados ou o conteúdo. Ao trocar o período, o conteúdo antigo fica esmaecido. */
export function EstadoWidget<T>({ estado, altura = "h-24", vazio, mensagemVazio, children }: EstadoWidgetProps<T>) {
  const { dados, carregando, erro, tentarDeNovo } = estado;

  if (erro) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 p-4 text-sm">
        <p>
          <span className="font-medium text-destructive">Não carregou.</span> {erro}
        </p>
        <Button variant="outline" size="sm" onClick={tentarDeNovo}>
          <RefreshCw aria-hidden />
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (dados === undefined) {
    return (
      <div aria-busy="true" className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", altura)}>
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  if (vazio?.(dados)) {
    return <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{mensagemVazio}</p>;
  }

  return (
    <div aria-busy={carregando} className={cn("transition-opacity", carregando && "opacity-60")}>
      {children(dados)}
    </div>
  );
}
