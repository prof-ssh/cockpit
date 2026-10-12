import { buscarVendas } from "./evo.client";
import { converterVenda, type VendaConvertida } from "./evo.schema";
import type { Falha } from "../../domain/vendas";

export type ResultadoBusca = { vendas: VendaConvertida[]; invalidas: Falha[] };

/**
 * A EVO como fonte de vendas: busca o período e já entrega cada venda
 * convertida para os tipos do banco. Quem usa não sabe o formato da EVO.
 */
export async function buscarVendasEvo(inicio: string, fim: string): Promise<ResultadoBusca> {
  const brutas = await buscarVendas(inicio, fim);
  const vendas: VendaConvertida[] = [];
  const invalidas: Falha[] = [];

  for (const bruta of brutas) {
    const convertida = converterVenda(bruta);
    if (convertida.ok) vendas.push(convertida.dados);
    else invalidas.push(convertida.falha);
  }
  return { vendas, invalidas };
}
