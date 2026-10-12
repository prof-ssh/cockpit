"use client";

import { useSyncExternalStore } from "react";
import { hojeLocal, mesExtenso } from "./formato";

const nada = () => () => {};

/** "Outubro de 2026, até o dia 12." A página é gerada no build, então a data sai do navegador. */
export function Subtitulo({ exemplo }: { exemplo: boolean }) {
  const hoje = useSyncExternalStore(nada, hojeLocal, () => null);
  return (
    <p className="min-h-6 text-muted-foreground">
      {hoje && `${mesExtenso(hoje)}, até o dia ${Number(hoje.slice(8, 10))}.`}
      {exemplo && " Números de exemplo."}
    </p>
  );
}
