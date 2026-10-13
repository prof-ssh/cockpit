"use client";

import { useCallback, useState, type FormEvent } from "react";
import { CalendarIcon, RefreshCw } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import { Alert, AlertDescription } from "@/frontend/design-system/components/ui/alert";
import { Button } from "@/frontend/design-system/components/ui/button";
import { Calendar } from "@/frontend/design-system/components/ui/calendar";
import { Card, CardContent } from "@/frontend/design-system/components/ui/card";
import { Label } from "@/frontend/design-system/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/design-system/components/ui/popover";
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

/** "AAAA-MM-DD" ↔ Date no horário local (o calendário trabalha com Date local). */
const paraData = (iso: string) => new Date(`${iso}T00:00:00`);
const paraIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function FormularioSync({ vendasAte, aoSincronizar }: { vendasAte: string | null; aoSincronizar: () => void }) {
  const hoje = hojeLocal();
  const sugerido = vendasAte && vendasAte < hoje ? somarDias(vendasAte, 1) : hoje;
  const [periodo, setPeriodo] = useState<DateRange | undefined>({ from: paraData(sugerido), to: paraData(hoje) });
  const [aberto, setAberto] = useState(false);
  const [envio, setEnvio] = useState<Envio>({ estado: "parado" });

  const inicio = periodo?.from ? paraIso(periodo.from) : null;
  // Um dia só: clicar uma vez no calendário marca início e fim iguais.
  const fim = periodo?.to ? paraIso(periodo.to) : inicio;
  const rotulo = inicio && fim ? (inicio === fim ? diaMes(inicio) : `${diaMes(inicio)} a ${diaMes(fim)}`) : "Escolha o período";

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!inicio || !fim) return;
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
        <div className="grid gap-1.5">
          <Label htmlFor="sync-periodo" className="text-xs text-muted-foreground">Período</Label>
          <Popover open={aberto} onOpenChange={setAberto}>
            <PopoverTrigger asChild>
              <Button id="sync-periodo" type="button" variant="outline" className="w-56 justify-start font-normal tabular-nums">
                <CalendarIcon aria-hidden />
                {rotulo}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                locale={ptBR}
                numberOfMonths={1}
                selected={periodo}
                onSelect={setPeriodo}
                defaultMonth={periodo?.to ?? periodo?.from}
                disabled={{ after: paraData(hoje) }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button type="submit" disabled={envio.estado === "rodando" || !inicio}>
          <RefreshCw aria-hidden className={envio.estado === "rodando" ? "animate-spin motion-reduce:animate-none" : ""} />
          {envio.estado === "rodando" ? "Sincronizando…" : "Sincronizar"}
        </Button>
      </form>
      <div aria-live="polite" className="text-sm tabular-nums">
        {envio.estado === "ok" && <p>{resumo(envio.resultado)}</p>}
        {envio.estado === "erro" && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription>Sync não concluído: {envio.mensagem}</AlertDescription>
          </Alert>
        )}
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
