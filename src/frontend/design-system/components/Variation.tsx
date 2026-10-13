import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Badge } from "@/frontend/design-system/components/ui/badge";
import { cn } from "cn";

type VariationProps = {
  current: number;
  previous: number;
  /** "higher": subir é bom (entradas, saldo). "lower": cair é bom (saídas, churn). */
  better: "higher" | "lower";
  /** "percent": variação relativa (%). "points": diferença de taxas em pontos percentuais. */
  format?: "percent" | "points";
};

type Leitura = { direcao: "up" | "down" | "flat"; bom: boolean | null; texto: string } | null;

const numero = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** Direção, se foi bom e o texto da variação. null quando não há base (anterior 0). */
function ler({ current, previous, better, format = "percent" }: VariationProps): Leitura {
  const diferenca =
    format === "points" ? (current - previous) * 100 : previous ? ((current - previous) / Math.abs(previous)) * 100 : null;
  if (diferenca == null || !Number.isFinite(diferenca)) return null;
  const direcao = Math.abs(diferenca) < 0.05 ? "flat" : diferenca > 0 ? "up" : "down";
  const bom = direcao === "flat" ? null : (direcao === "up") === (better === "higher");
  const texto = `${numero(Math.abs(diferenca))}${format === "points" ? " p.p." : "%"}`;
  return { direcao, bom, texto };
}

const SETAS = { up: ArrowUp, down: ArrowDown, flat: Minus };
const LEITOR = { up: "aumento de", down: "queda de", flat: "sem variação" };

/**
 * Variação contra o período anterior: seta na direção e a cor diz se foi bom
 * (Tiffany) ou ruim (destructive). Sem palavras "melhor/pior": a cor basta.
 */
export function Variation({ label, ...props }: VariationProps & { label: string }) {
  const leitura = ler(props);
  if (!leitura) return <p className="text-sm text-muted-foreground tabular-nums">{label}</p>;
  const Seta = SETAS[leitura.direcao];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground tabular-nums">
      <Badge
        variant="outline"
        className={cn(
          leitura.bom === true && "border-transparent bg-primary text-primary-foreground",
          leitura.bom === false && "border-transparent bg-destructive text-destructive-foreground",
        )}
      >
        <Seta aria-hidden />
        <span className="sr-only">{LEITOR[leitura.direcao]}</span>
        {leitura.direcao === "flat" ? "Igual" : leitura.texto}
      </Badge>
      <span>{label}</span>
    </div>
  );
}

/** A mesma variação, compacta, para listas: seta e número na cor de bom ou ruim. */
export function VariationInline(props: VariationProps) {
  const leitura = ler(props);
  if (!leitura) return null;
  const Seta = SETAS[leitura.direcao];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        leitura.bom == null && "text-muted-foreground",
        leitura.bom === true && "text-chart-5",
        leitura.bom === false && "text-destructive",
      )}
    >
      <Seta className="size-3" aria-hidden />
      <span className="sr-only">{LEITOR[leitura.direcao]}</span>
      {leitura.direcao === "flat" ? "0%" : leitura.texto}
    </span>
  );
}
