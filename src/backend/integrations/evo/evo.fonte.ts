import { buscarVendas } from "./evo.client";
import { converterVenda, type VendaConvertida } from "./evo.schema";

export type VendaInvalida = { idSale: unknown; motivo: string };
export type ResultadoBusca = { vendas: VendaConvertida[]; invalidas: VendaInvalida[] };

/**
 * A EVO como fonte de vendas: busca o período e já entrega cada venda
 * convertida para os tipos do banco. Quem usa não sabe o formato da EVO.
 */
export async function buscarVendasEvo(inicio: string, fim: string): Promise<ResultadoBusca> {
  const brutas = await buscarVendas(inicio, fim);
  const vendas: VendaConvertida[] = [];
  const invalidas: VendaInvalida[] = [];

  for (const bruta of brutas) {
    const convertida = converterVenda(bruta);
    if (convertida.ok) vendas.push(convertida.dados);
    else invalidas.push({ idSale: (bruta as { idSale?: unknown } | null)?.idSale, motivo: convertida.motivo });
  }
  return { vendas, invalidas };
}
