"use client";

import { useCallback, useState } from "react";
import { Metric } from "@/frontend/design-system/components/Metric";
import { PeriodToggle } from "@/frontend/design-system/components/PeriodToggle";
import { Variation } from "@/frontend/design-system/components/Variation";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/design-system/components/ui/card";
import { Campo, SemContratos } from "./Campo";
import { buscarPrevisao } from "./dados";
import { EstadoWidget } from "./EstadoWidget";
import { num, pct } from "./formato";
import type { Dias, Previsao } from "./tipos";
import { useDados } from "./use-dados";

/** Previsão dos próximos 30/60/90 dias. É estimativa: fundo muted e borda tracejada, nunca o Tiffany. */
export function PrevisaoCard() {
  const [dias, setDias] = useState<Dias>(30);
  const estado = useDados(useCallback(() => buscarPrevisao(dias), [dias]));

  return (
    <Card className="border-dashed border-input bg-muted">
      <CardHeader>
        <CardTitle>Previsão dos próximos {dias} dias</CardTitle>
        <CardDescription>Média dos últimos 6 meses e contratos que vão vencer.</CardDescription>
        <CardAction>
          <PeriodToggle label="Período da previsão" value={dias} onValueChange={setDias} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <EstadoWidget estado={estado} altura="h-28">
          {(dados) => <Numeros dados={dados} />}
        </EstadoWidget>
      </CardContent>
    </Card>
  );
}

function Numeros({ dados }: { dados: Previsao }) {
  const { dias, previsto, realizado, base } = dados;
  const nosUltimos = (n: number) => `vs ${num(n)} nos últimos ${dias} dias`;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <Metric
        label="Entradas previstas"
        value={num(previsto.entradas)}
        info={
          <>
            Média mensal das vendas (<Campo>saleDate</Campo>, itens com <Campo>idMembership</Campo>) nos últimos 6 meses
            fechados ÷ 30,4 × {dias} dias. Hoje: {num(base.mediaMensalEntradas)} por mês. A etiqueta compara com o
            realizado dos últimos {dias} dias.
          </>
        }
      >
        <Variation better="higher" current={previsto.entradas} previous={realizado.entradas} label={nosUltimos(realizado.entradas)} />
      </Metric>

      <Metric
        label="Saídas previstas"
        value={previsto.saidas == null ? "—" : num(previsto.saidas)}
        info={
          base.vencimentos == null || base.churnMedio == null ? (
            <>Contratos com data de fim nos próximos {dias} dias × churn médio dos últimos 6 meses fechados. A data de fim vem dos contratos da EVO.</>
          ) : (
            <>
              Contratos com data de fim nos próximos {dias} dias ({num(base.vencimentos)}) × churn médio dos últimos 6
              meses fechados ({pct(base.churnMedio)}). A data de fim vem dos contratos da EVO.
            </>
          )
        }
      >
        {previsto.saidas == null || realizado.saidas == null ? (
          <SemContratos />
        ) : (
          <Variation better="lower" current={previsto.saidas} previous={realizado.saidas} label={nosUltimos(realizado.saidas)} />
        )}
      </Metric>

      <Metric
        label="Saldo previsto"
        value={previsto.saldo == null ? "—" : num(previsto.saldo)}
        info={<>Entradas previstas − saídas previstas.</>}
      >
        {previsto.saldo == null || realizado.saldo == null ? (
          <SemContratos />
        ) : (
          <Variation better="higher" current={previsto.saldo} previous={realizado.saldo} label={nosUltimos(realizado.saldo)} />
        )}
      </Metric>
    </div>
  );
}
