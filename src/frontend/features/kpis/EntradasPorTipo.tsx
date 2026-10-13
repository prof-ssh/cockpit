"use client";

import { useCallback, useState } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from "recharts";
import { Variation, VariationInline } from "@/frontend/design-system/components/Variation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/frontend/design-system/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/frontend/design-system/components/ui/chart";
import { buscarEntradasMensais } from "./dados";
import { EstadoWidget } from "./EstadoWidget";
import { mesAno, mesCurto, num } from "./formato";
import type { EntradasMensais, RegistrationKind } from "./tipos";
import { useDados } from "./use-dados";

/** Ordem fixa das cores e da pilha (de baixo para cima). */
const TIPOS: RegistrationKind[] = ["enrollment", "renewal", "re-enrollment", "outras"];

const CONFIG = {
  enrollment: { label: "Nova venda", color: "var(--chart-1)" },
  renewal: { label: "Renovação", color: "var(--chart-2)" },
  "re-enrollment": { label: "Rematrícula", color: "var(--chart-3)" },
  outras: { label: "Outras vendas", color: "var(--chart-4)" },
  tendencia: { label: "Tendência (média de 3 meses)", color: "var(--chart-5)" },
} satisfies ChartConfig;

/** Teto "redondo" do eixo: 137 → 200, 61 → 100. */
function tetoRedondo(valor: number) {
  const potencia = 10 ** Math.floor(Math.log10(Math.max(valor, 1)));
  const n = valor / potencia;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * potencia;
}

/** Entradas por mês e tipo de venda, com o detalhe do mês escolhido ao lado. */
export function EntradasPorTipo() {
  const estado = useDados(useCallback(() => buscarEntradasMensais(), []));
  return (
    <EstadoWidget
      estado={estado}
      altura="h-80"
      vazio={(d) => d.meses.every((m) => m.total === 0)}
      mensagemVazio="Nenhuma venda de contrato nos últimos 12 meses. Sincronize os dados para ver as entradas."
    >
      {(dados) => <Conteudo dados={dados} />}
    </EstadoWidget>
  );
}

function Conteudo({ dados }: { dados: EntradasMensais }) {
  const { meses, mediaMensal, ate } = dados;
  const ultimo = meses.length - 1;
  // Começa no último mês fechado.
  const [sel, setSel] = useState(meses[ultimo]?.fechado ? ultimo : Math.max(0, ultimo - 1));
  const escolher = (indice: unknown) => {
    const i = Number(indice);
    if (Number.isInteger(i) && i >= 0 && i < meses.length) setSel(i);
  };

  const linhas = meses.map((m, i) => ({
    rotulo: mesCurto(m.mes),
    fechado: m.fechado,
    ...m.porTipo,
    // Tendência só com meses fechados: média dos 3 últimos.
    tendencia:
      m.fechado && i >= 2 && meses[i - 1].fechado && meses[i - 2].fechado
        ? (m.total + meses[i - 1].total + meses[i - 2].total) / 3
        : null,
  }));

  const teto = tetoRedondo(Math.max(...meses.map((m) => m.total)) * 1.05);
  const mes = meses[sel];
  const anterior = sel > 0 ? meses[sel - 1] : null;
  const emAndamento = !mes.fechado;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Entradas por tipo de venda</CardTitle>
          <CardDescription>
            Últimos 12 meses. Linha: tendência (média de 3 meses).
            {meses[ultimo] && !meses[ultimo].fechado && ` ${mesAno(meses[ultimo].mes)} em andamento.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <ChartContainer config={CONFIG} className="aspect-auto h-64 min-w-[520px]">
              <ComposedChart
                data={linhas}
                margin={{ left: 0, right: 8, top: 8 }}
                accessibilityLayer
                onMouseMove={(s) => escolher(s?.activeTooltipIndex)}
                onClick={(s) => escolher(s?.activeTooltipIndex)}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="rotulo"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={({ x, y, payload, index }) => (
                    <text
                      x={x}
                      y={y}
                      dy={12}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={index === sel ? 600 : 400}
                      style={{ fill: index === sel ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      {payload.value}
                    </text>
                  )}
                />
                <YAxis
                  width={36}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, teto]}
                  ticks={[0, 0.25, 0.5, 0.75, 1].map((f) => f * teto)}
                />
                {/* Fundo do mês escolhido (o detalhe dele está no card ao lado). */}
                <ReferenceArea x1={linhas[sel].rotulo} x2={linhas[sel].rotulo} fill="var(--muted)" fillOpacity={1} ifOverflow="extendDomain" />
                <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                {TIPOS.map((tipo, k) => (
                  <Bar
                    key={tipo}
                    dataKey={tipo}
                    stackId="entradas"
                    fill={`var(--color-${tipo})`}
                    stroke="var(--card)"
                    strokeWidth={1}
                    radius={k === TIPOS.length - 1 ? [2, 2, 0, 0] : 0}
                    isAnimationActive={false}
                  >
                    {/* Mês em andamento mais claro: ainda não é comparável. */}
                    {linhas.map((l) => (
                      <Cell key={l.rotulo} fillOpacity={l.fechado ? 1 : 0.55} />
                    ))}
                  </Bar>
                ))}
                <Line
                  dataKey="tendencia"
                  type="monotone"
                  stroke="var(--color-tendencia)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
              </ComposedChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>
            {mesAno(mes.mes)}
            {emAndamento && ` (até dia ${Number(ate.slice(8, 10))})`}
          </CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {num(mes.total)} {mes.total === 1 ? "venda" : "vendas"}
          </CardTitle>
          <div className="mt-1">
            {emAndamento ? (
              <span className="text-sm text-muted-foreground">Mês em andamento, sem comparação.</span>
            ) : (
              anterior && (
                <Variation
                  better="higher"
                  current={mes.total}
                  previous={anterior.total}
                  label={`vs ${num(anterior.total)} em ${mesAno(anterior.mes)}`}
                />
              )
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {TIPOS.map((tipo) => (
            <div key={tipo} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-[2px]" style={{ background: CONFIG[tipo].color }} aria-hidden />
                {CONFIG[tipo].label}
              </span>
              <span className="inline-flex items-center gap-2 tabular-nums">
                {num(mes.porTipo[tipo])}
                {!emAndamento && anterior && (
                  <VariationInline better="higher" current={mes.porTipo[tipo]} previous={anterior.porTipo[tipo]} />
                )}
              </span>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-between border-t text-sm">
          <span className="text-muted-foreground">Média 6 meses</span>
          <span className="tabular-nums">{num(mediaMensal)}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
