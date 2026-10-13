"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import { Monitor, Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/frontend/design-system/components/ui/toggle-group";
import { aplicarTema, lerTema, observarTema, type Tema } from "./tema";

/** Topo fixo do Cockpit: logo, o que a página quiser mostrar (children) e o tema. */
export function Cabecalho({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Um logo por tema; o CSS mostra o certo, sem esperar o JavaScript. */}
          <Image src="/logo-claro.png" alt="The Senses Wellness Club" width={171} height={36} priority className="h-9 w-auto dark:hidden" />
          <Image src="/logo-escuro.png" alt="The Senses Wellness Club" width={171} height={36} priority className="hidden h-9 w-auto dark:block" />
          {children}
        </div>
        <EscolhaDeTema />
      </div>
    </header>
  );
}

const OPCOES: { valor: Tema; nome: string; Icone: typeof Sun }[] = [
  { valor: "claro", nome: "Claro", Icone: Sun },
  { valor: "escuro", nome: "Escuro", Icone: Moon },
  { valor: "sistema", nome: "Sistema", Icone: Monitor },
];

function EscolhaDeTema() {
  const tema = useSyncExternalStore(observarTema, lerTema, () => "sistema" as Tema);
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Tema"
      value={tema}
      onValueChange={(v) => v && aplicarTema(v as Tema)}
    >
      {OPCOES.map(({ valor, nome, Icone }) => (
        <ToggleGroupItem key={valor} value={valor} aria-label={nome} className="data-[state=on]:bg-accent">
          <Icone aria-hidden />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
