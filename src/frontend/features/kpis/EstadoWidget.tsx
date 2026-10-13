"use client";

import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/design-system/components/ui/alert";
import { Button } from "@/frontend/design-system/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/frontend/design-system/components/ui/empty";
import { Skeleton } from "@/frontend/design-system/components/ui/skeleton";
import { cn } from "cn";
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
      <Alert variant="destructive">
        <AlertCircle aria-hidden />
        <AlertTitle>Não carregou</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <p>{erro}</p>
          <Button variant="outline" size="sm" onClick={tentarDeNovo}>
            <RefreshCw aria-hidden />
            Tentar de novo
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (dados === undefined) {
    return (
      <div aria-busy="true">
        <Skeleton className={cn("motion-reduce:animate-none", altura)} />
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  if (vazio?.(dados)) {
    return (
      <Empty className="border border-dashed p-6 md:p-6">
        <EmptyHeader>
          <EmptyDescription>{mensagemVazio}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div aria-busy={carregando} className={cn("transition-opacity", carregando && "opacity-60")}>
      {children(dados)}
    </div>
  );
}
