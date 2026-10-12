import { Badge } from "@/frontend/design-system/components/ui/badge";
import { Cabecalho } from "@/frontend/features/app/Cabecalho";
import { ChurnPorVencimento } from "./ChurnPorVencimento";
import { USANDO_DADOS_DE_EXEMPLO } from "./dados";
import { EntradasPorTipo } from "./EntradasPorTipo";
import { PrevisaoCard } from "./PrevisaoCard";
import { RealizadoCard } from "./RealizadoCard";
import { Subtitulo } from "./Subtitulo";
import { SyncCard } from "./SyncCard";
import { VencimentosCard } from "./VencimentosCard";

/** Tela de KPIs: só monta os widgets. Cada um busca os próprios dados. */
export function PaginaKpis() {
  return (
    <div className="min-h-full">
      <Cabecalho>
        {USANDO_DADOS_DE_EXEMPLO && (
          <Badge variant="outline" className="border-dashed" title="Os números desta tela são inventados">
            Dados de exemplo
          </Badge>
        )}
      </Cabecalho>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <SyncCard />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Entradas e saídas</h1>
          <Subtitulo exemplo={USANDO_DADOS_DE_EXEMPLO} />
        </div>
        <RealizadoCard />
        <PrevisaoCard />
        <EntradasPorTipo />
        <ChurnPorVencimento />
        <VencimentosCard />
      </main>
    </div>
  );
}
