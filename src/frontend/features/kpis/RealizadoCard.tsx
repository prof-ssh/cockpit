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
import { buscarRealizado } from "./dados";
import { EstadoWidget } from "./EstadoWidget";
import { num, pct } from "./formato";
import type { Dias, Realizado } from "./tipos";
import { useDados } from "./use-dados";

/** Realizado nos últimos 30/60/90 dias, comparado com o período anterior. */
export function RealizadoCard() {
  const [dias, setDias] = useState<Dias>(30);
  const estado = useDados(useCallback(() => buscarRealizado(dias), [dias]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realizado nos últimos {dias} dias</CardTitle>
        <CardDescription>Dados consolidados, comparados com os {dias} dias anteriores.</CardDescription>
        <CardAction>
          <PeriodToggle label="Período do realizado" value={dias} onValueChange={setDias} />
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

function Numeros({ dados }: { dados: Realizado }) {
  const { dias, atual, anterior } = dados;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Metric
        label="Entradas"
        value={num(atual.entradas)}
        info={
          <>
            Vendas com <Campo>saleDate</Campo> nos últimos {dias} dias, contando só itens de contrato (
            <Campo>idMembership</Campo> preenchido). Somamos todos os <Campo>registrationKind</Campo>: enrollment,
            re-enrollment, renewal e vazio. Comparação: a mesma conta nos {dias} dias anteriores.
          </>
        }
      >
        <Variation better="higher" current={atual.entradas} previous={anterior.entradas} label={`vs ${num(anterior.entradas)}`} />
      </Metric>

      <Metric
        label="Saídas"
        value={atual.saidas == null ? "—" : num(atual.saidas)}
        info={
          <>
            Contratos cuja data de fim (<Campo>membershipEnd</Campo>) caiu no período e cuja janela de 45 dias já
            fechou, sem novo contrato do mesmo <Campo>idMember</Campo>. A data de fim vem dos contratos da EVO.
          </>
        }
      >
        {atual.saidas == null || anterior.saidas == null ? (
          <SemContratos />
        ) : (
          <Variation better="lower" current={atual.saidas} previous={anterior.saidas} label={`vs ${num(anterior.saidas)}`} />
        )}
      </Metric>

      <Metric
        label="Saldo"
        value={atual.saldo == null ? "—" : num(atual.saldo)}
        info={<>Entradas − saídas do período, as duas contas acima.</>}
      >
        {atual.saldo == null || anterior.saldo == null ? (
          <SemContratos />
        ) : (
          <Variation better="higher" current={atual.saldo} previous={anterior.saldo} label={`vs ${num(anterior.saldo)}`} />
        )}
      </Metric>

      <Metric
        label="Churn por vencimento"
        value={atual.churn == null ? "—" : pct(atual.churn)}
        info={
          <>
            Saídas ÷ contratos que venceram no período (<Campo>membershipEnd</Campo>). Só entram contratos com a
            janela de 45 dias fechada. A variação é em pontos percentuais.
          </>
        }
      >
        {atual.churn == null || anterior.churn == null ? (
          <SemContratos />
        ) : (
          <Variation better="lower" format="points" current={atual.churn} previous={anterior.churn} label={`vs ${pct(anterior.churn)}`} />
        )}
      </Metric>
    </div>
  );
}
