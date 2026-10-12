"use client";

import { useCallback, useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/frontend/design-system/components/ui/button";
import { Card, CardContent } from "@/frontend/design-system/components/ui/card";
import { Input } from "@/frontend/design-system/components/ui/input";
import { Label } from "@/frontend/design-system/components/ui/label";
import { buscarUltimaColeta, sincronizar } from "./dados";
import { EstadoWidget } from "./EstadoWidget";
import { diaMes, hojeLocal, num, quando, somarDias } from "./formato";
import type { ResultadoSync, UltimaColeta } from "./tipos";
import { useDados } from "./use-dados";

type Envio =
  | { estado: "parado" }
  | { estado: "rodando" }
  | { estado: "ok"; resultado: ResultadoSync }
  | { estado: "erro"; mensagem: string };

/** Faixa "Sincronizar dados": quando foi o último sync e o formulário para rodar outro. */
export function SyncCard() {
  const [recarga, setRecarga] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recarga força buscar de novo após um sync
  const buscar = useCallback(() => buscarUltimaColeta(), [recarga]);
  const estado = useDados(buscar);

  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-display text-lg leading-tight font-semibold">Sincronizar dados</h2>
          <EstadoWidget estado={estado} altura="h-5 w-72">
            {(dados) => <UltimoSync dados={dados} />}
          </EstadoWidget>
        </div>
        {estado.dados !== undefined && (
          <FormularioSync
            // As datas sugeridas saem do primeiro carregamento; depois a pessoa escolhe.
            vendasAte={estado.dados.vendasAte}
            aoSincronizar={() => setRecarga((r) => r + 1)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function UltimoSync({ dados }: { dados: UltimaColeta }) {
  const { coleta, vendasAte } = dados;
  if (!coleta) return <p className="text-sm text-muted-foreground">Nenhum sync ainda. Escolha o período e sincronize.</p>;
  const ate = vendasAte ? `, com vendas até ${diaMes(vendasAte)}` : "";
  if (coleta.status === "em_andamento") {
    return <p className="text-sm text-muted-foreground tabular-nums">Sync em andamento desde {quando(coleta.iniciadaEm, hojeLocal())}.</p>;
  }
  return (
    <p className="text-sm text-muted-foreground tabular-nums">
      Último sync {quando(coleta.finalizadaEm ?? coleta.iniciadaEm, hojeLocal())}
      {ate}.{coleta.status === "erro" && <span className="text-destructive"> Ele falhou: rode de novo.</span>}
    </p>
  );
}

function FormularioSync({ vendasAte, aoSincronizar }: { vendasAte: string | null; aoSincronizar: () => void }) {
  const hoje = hojeLocal();
  const [inicio, setInicio] = useState(vendasAte ? somarDias(vendasAte, 1) : hoje);
  const [fim, setFim] = useState(hoje);
  const [envio, setEnvio] = useState<Envio>({ estado: "parado" });
  const datasInvalidas = Boolean(inicio && fim && fim < inicio);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (datasInvalidas || !inicio || !fim) return;
    setEnvio({ estado: "rodando" });
    try {
      const resultado = await sincronizar({ periodoInicio: inicio, periodoFim: fim });
      setEnvio({ estado: "ok", resultado });
      aoSincronizar();
    } catch (erro) {
      setEnvio({ estado: "erro", mensagem: erro instanceof Error ? erro.message : "O sync falhou." });
    }
  }

  return (
    <div className="flex flex-col gap-2 lg:items-end">
      <form onSubmit={enviar} className="flex flex-wrap items-end gap-3">
        <div className="grid w-40 gap-1.5">
          <Label htmlFor="sync-de" className="text-xs text-muted-foreground">De</Label>
          <Input id="sync-de" type="date" required value={inicio} max={hoje} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="grid w-40 gap-1.5">
          <Label htmlFor="sync-ate" className="text-xs text-muted-foreground">Até</Label>
          <Input
            id="sync-ate"
            type="date"
            required
            value={fim}
            max={hoje}
            aria-invalid={datasInvalidas || undefined}
            aria-describedby={datasInvalidas ? "sync-erro-data" : undefined}
            onChange={(e) => setFim(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={envio.estado === "rodando" || datasInvalidas}>
          <RefreshCw aria-hidden className={envio.estado === "rodando" ? "animate-spin motion-reduce:animate-none" : ""} />
          {envio.estado === "rodando" ? "Sincronizando…" : "Sincronizar"}
        </Button>
      </form>
      <div aria-live="polite" className="text-sm tabular-nums">
        {datasInvalidas && (
          <p id="sync-erro-data" className="text-destructive">A data final precisa ser depois da inicial.</p>
        )}
        {envio.estado === "ok" && <p>{resumo(envio.resultado)}</p>}
        {envio.estado === "erro" && <p className="text-destructive">Sync não concluído: {envio.mensagem}</p>}
      </div>
    </div>
  );
}

function resumo({ criadas, existentes, falhas }: ResultadoSync) {
  const novas = criadas === 1 ? "1 venda nova" : `${num(criadas)} vendas novas`;
  const ja = existentes ? `, ${num(existentes)} já estavam no banco` : "";
  const erros = falhas === 0 ? " e nenhuma falha" : falhas === 1 ? " e 1 falha" : ` e ${num(falhas)} falhas`;
  return `Sincronizado: ${novas}${ja}${erros}.`;
}
