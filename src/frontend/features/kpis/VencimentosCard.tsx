"use client";

import { useCallback, useState } from "react";
import { FacetedFilter } from "@/frontend/design-system/components/FacetedFilter";
import { Metric } from "@/frontend/design-system/components/Metric";
import { PeriodToggle } from "@/frontend/design-system/components/PeriodToggle";
import { VariationInline } from "@/frontend/design-system/components/Variation";
import { Badge } from "@/frontend/design-system/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/design-system/components/ui/card";
import { Progress } from "@/frontend/design-system/components/ui/progress";
import { Separator } from "@/frontend/design-system/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/design-system/components/ui/table";
import { buscarVencimentos } from "./dados";
import { EstadoWidget } from "./EstadoWidget";
import { diaMes, num, pct } from "./formato";
import type { Dias, Vencimentos } from "./tipos";
import { useDados } from "./use-dados";

/** Faltando até tantos dias, o prazo ganha destaque na lista. */
const URGENTE_DIAS = 7;

/** Saídas previstas por vencimento: quantos contratos vencem e a lista para a equipe agir. */
export function VencimentosCard() {
  const [dias, setDias] = useState<Dias>(30);
  const estado = useDados(useCallback(() => buscarVencimentos(dias), [dias]));

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Saídas previstas por vencimento</CardTitle>
        <CardDescription>Contratos que vencem nos próximos {dias} dias.</CardDescription>
        <CardAction>
          <PeriodToggle label="Período dos vencimentos" value={dias} onValueChange={setDias} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <EstadoWidget
          estado={estado}
          altura="h-64"
          vazio={(d) => d.total === 0}
          mensagemVazio={`Nenhum contrato vence nos próximos ${dias} dias.`}
        >
          {(dados) => <Conteudo dados={dados} />}
        </EstadoWidget>
      </CardContent>
    </Card>
  );
}

function Conteudo({ dados }: { dados: Vencimentos }) {
  const { total, recorrentes, naoRecorrentes, saidasPrevistas, churnMedio, anterior, contratos } = dados;
  // Começa mostrando quem não renova sozinho: é com eles que a equipe precisa falar.
  const [filtro, setFiltro] = useState<string[]>(["sem"]);

  const contagem = {
    com: contratos.filter((c) => c.recorrente).length,
    sem: contratos.filter((c) => !c.recorrente).length,
  };
  const lista = contratos.filter((c) => filtro.length === 0 || filtro.includes(c.recorrente ? "com" : "sem"));
  const parte = (n: number) => `${pct(n / total)} dos que vencem`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Metric label="Vencem" value={num(total)}>
          {anterior.venceram != null && <VariationInline better="lower" current={total} previous={anterior.venceram} />}
        </Metric>
        <Metric label="Com recorrência" value={num(recorrentes)}>
          <span className="text-sm text-muted-foreground tabular-nums">{parte(recorrentes)}</span>
        </Metric>
        <Metric label="Sem recorrência" value={num(naoRecorrentes)}>
          <span className="text-sm text-muted-foreground tabular-nums">{parte(naoRecorrentes)}</span>
        </Metric>
        <Metric label="Saídas previstas" value={saidasPrevistas == null ? "—" : num(saidasPrevistas)}>
          {saidasPrevistas != null && churnMedio != null && (
            <span className="inline-flex flex-wrap items-center gap-2 text-sm text-muted-foreground tabular-nums">
              {pct(churnMedio)} dos que vencem
              {anterior.saidas != null && (
                <VariationInline better="lower" current={saidasPrevistas} previous={anterior.saidas} />
              )}
            </span>
          )}
        </Metric>
      </div>

      <div className="flex flex-col gap-2">
        {/* Parte cheia (Tiffany) = com recorrência; o fundo (chart-2) = sem recorrência. */}
        <Progress value={(recorrentes / total) * 100} className="bg-chart-2" aria-label="Contratos com recorrência" />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-chart-1" aria-hidden />
            Com recorrência
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-chart-2" aria-hidden />
            Sem recorrência
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <FacetedFilter
          title="Recorrência"
          selected={filtro}
          onChange={setFiltro}
          options={[
            { value: "com", label: "Com", count: contagem.com },
            { value: "sem", label: "Sem", count: contagem.sem },
          ]}
        />
        <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {lista.length} de {contratos.length} contratos
        </span>
      </div>

      <Table className="min-w-[520px]">
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Vence em</TableHead>
            <TableHead>Recorrência</TableHead>
            <TableHead className="text-right">Faltam</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lista.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                Nenhum contrato com esse filtro.
              </TableCell>
            </TableRow>
          ) : (
            lista.map((c) => (
              <TableRow key={c.idMemberMembership}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.nameMembership}</TableCell>
                <TableCell className="tabular-nums">{diaMes(c.membershipEnd)}</TableCell>
                <TableCell>
                  {c.recorrente ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.dias <= URGENTE_DIAS ? <Badge>{c.dias} dias</Badge> : `${c.dias} dias`}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
