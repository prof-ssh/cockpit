import type { ReactNode } from "react";

/** Nome de um campo do banco dentro dos textos de "como calculamos". */
export function Campo({ children }: { children: ReactNode }) {
  return <code className="rounded-sm bg-background/20 px-1 font-mono text-[11px]">{children}</code>;
}

/** Linha de apoio de um número que depende dos contratos da EVO, ainda não sincronizados. */
export function SemContratos() {
  return <p className="text-sm text-muted-foreground">Depende dos contratos da EVO.</p>;
}
