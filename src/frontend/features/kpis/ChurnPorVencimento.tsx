"use client";

import { useCallback, useId, useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import { Variation } from "@/frontend/design-system/components/Variation";
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/frontend/design-system/components/ui/chart";
import { buscarChurnMensal } from "./dados";
import { EstadoWidget } from "./EstadoWidget";
import { mesAno, mesCurto, num, pct } from "./formato";
import type { ChurnMensal } from "./tipos";
import { useDados } from "./use-dados";

const CONFIG = {
  churn: { label: "Churn", color: "var(--chart-2)" },
  emApuracao: { label: "Em apuração", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** Altura da barra listrada dos meses cuja janela de 45 dias ainda não fechou. */
const ALTURA_EM_APURACAO = 0.2;

/** Churn por mês de vencimento, com a média dos 6 últimos meses fechados. */
export function ChurnPorVencimento() {
  const estado = useDados(useCallback(() => buscarChurnMensal(), []));
  return (
    <EstadoWidget
      estado={estado}
      altura="h-72"
      vazio={(d) => d.meses.every((m) => m.venceram === 0)}
      mensagemVazio="Nenhum contrato venceu nos últimos 12 meses. O churn depende dos contratos da EVO."
    >
      {(dados) => <Conteudo dados={dados} />}
    </EstadoWidget>
  );
}

function Conteudo({ dados }: { dados: ChurnMensal }) {
  const { meses, churnMedio } = dados;
  const hachura = `hachura-${useId().replace(/:/g, "")}`;
  // Começa no último mês com a janela fechada.
  const ultimoFechado = meses.findLastIndex((m) => m.churn != null);
  const [sel, setSel] = useState(ultimoFechado >= 0 ? ultimoFechado : meses.length - 1);
  const escolher = (indice: unknown) => {
    const i = Number(indice);
    if (Number.isInteger(i) && i >= 0 && i < meses.length) setSel(i);
  };

  const linhas = meses.map((m) => ({
    rotulo: mesCurto(m.mes),
    churn: m.churn,
    emApuracao: m.churn == null ? ALTURA_EM_APURACAO : null,
  }));
  const maximo = Math.max(0.25, ...meses.map((m) => m.churn ?? 0));

  const mes = meses[sel];
  const anterior = sel > 0 ? meses[sel - 1] : null;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Churn por vencimento</CardTitle>
          <CardDescription>Venceram no mês e não voltaram em 45 dias. Meses listrados ainda estão na janela.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Listras dos meses em apuração (textura, não só cor). */}
          <svg width="0" height="0" className="absolute" aria-hidden>
            <defs>
              <pattern id={hachura} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart-3)" strokeWidth="2" />
              </pattern>
            </defs>
          </svg>
          <div className="overflow-x-auto">
            <ChartContainer config={CONFIG} className="aspect-auto h-52 min-w-[520px]">
              <BarChart
                data={linhas}
                margin={{ left: 0, right: 8, top: 16 }}
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
                  domain={[0, maximo]}
                  ticks={[0, 0.05, 0.1, 0.15, 0.2, 0.25].filter((t) => t <= maximo)}
                  tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                />
                <ReferenceArea x1={linhas[sel].rotulo} x2={linhas[sel].rotulo} fill="var(--muted)" fillOpacity={1} ifOverflow="extendDomain" />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={
                    <ChartTooltipContent
                      formatter={(valor, nome) =>
                        nome === "emApuracao" ? "Em apuração" : `Churn ${pct(Number(valor))}`
                      }
                    />
                  }
                />
                <Bar dataKey="churn" stackId="c" fill="var(--color-churn)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="emApuracao" stackId="c" fill={`url(#${hachura})`} fillOpacity={0.5} isAnimationActive={false} />
                {churnMedio != null && (
                  <ReferenceLine
                    y={churnMedio}
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    label={{
                      value: `média 6 meses ${pct(churnMedio)}`,
                      position: "insideTopRight",
                      fontSize: 11,
                      fill: "var(--foreground)",
                    }}
                  />
                )}
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>{mesAno(mes.mes)}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{mes.churn == null ? "Em apuração" : pct(mes.churn)}</CardTitle>
          {mes.churn != null && anterior?.churn != null && (
            <div className="mt-1">
              <Variation
                better="lower"
                format="points"
                current={mes.churn}
                previous={anterior.churn}
                label={`vs ${pct(anterior.churn)} em ${mesAno(anterior.mes)}`}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Venceram</span>
            <span className="tabular-nums">{num(mes.venceram)}</span>
          </div>
          {mes.sairam != null && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renovaram ou rematricularam</span>
                <span className="tabular-nums">{num(mes.venceram - mes.sairam)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saíram</span>
                <span className="tabular-nums">{num(mes.sairam)}</span>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t text-sm">
          <span className="text-muted-foreground">Média 6 meses</span>
          <span className="tabular-nums">{churnMedio == null ? "—" : pct(churnMedio)}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
