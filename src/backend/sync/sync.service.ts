import { buscarVendas } from "../evo/evo.client";
import { converterVenda, type VendaConvertida } from "../evo/evo.schema";
import type { SyncEntrada } from "./sync.schema";
import { gravarVendas } from "@/database/repositories/vendas.repository";
import {
  concluirColeta,
  falharColeta,
  iniciarColeta,
} from "@/database/repositories/coletas.repository";

export type ResultadoSync = { criadas: number; existentes: number; falhas: number };

/**
 * EVO → validação → banco, registrando tudo em `coletas`.
 * Vendas inválidas contam como falha e não impedem as outras de entrar.
 */
export async function sincronizar({ periodoInicio, periodoFim }: SyncEntrada): Promise<ResultadoSync> {
  const idColeta = await iniciarColeta({
    periodoInicio: new Date(periodoInicio),
    periodoFim: new Date(periodoFim),
  });

  try {
    const brutas = await buscarVendas(periodoInicio, periodoFim);
    const { validas, falhas } = prepararVendas(brutas);

    const gravacao = await gravarVendas(
      validas.map((v) => v.venda),
      validas.flatMap((v) => v.itens),
    );

    const resultado = { ...gravacao.vendas, falhas };
    await concluirColeta(idColeta, resultado);
    return resultado;
  } catch (erro) {
    await falharColeta(idColeta, erro instanceof Error ? erro.message : String(erro));
    throw erro;
  }
}

/**
 * Converte as vendas cruas e tira as repetidas. A mesma venda repetida com
 * dados iguais conta uma vez só; com dados diferentes, as cópias viram falha.
 */
export function prepararVendas(brutas: unknown[]): { validas: VendaConvertida[]; falhas: number } {
  const porId = new Map<number, { dados: VendaConvertida; json: string }>();
  const conflitantes = new Set<number>();
  let falhas = 0;

  for (const bruta of brutas) {
    const convertida = converterVenda(bruta);
    if (!convertida.ok) {
      falhas++;
      console.warn(`[sync] venda ${idDe(bruta)} ignorada: ${convertida.motivo}`);
      continue;
    }

    const { idSale } = convertida.dados.venda;
    const json = JSON.stringify(convertida.dados);
    const anterior = porId.get(idSale);
    if (!anterior) {
      porId.set(idSale, { dados: convertida.dados, json });
    } else if (anterior.json !== json) {
      conflitantes.add(idSale);
    }
  }

  for (const idSale of conflitantes) {
    porId.delete(idSale);
    falhas++;
    console.warn(`[sync] venda ${idSale} ignorada: veio repetida com dados diferentes`);
  }

  return { validas: [...porId.values()].map((v) => v.dados), falhas };
}

function idDe(bruta: unknown) {
  return (bruta as { idSale?: unknown } | null)?.idSale ?? "sem idSale";
}
