import { db } from "../client";
import type { Prisma } from "../generated/prisma/client";

// Formatos de entrada, já convertidos para os tipos do banco.
// O backend importa estes tipos daqui, nunca do Prisma direto.
export type NovaVenda = Prisma.VendaCreateManyInput;
export type NovoItemVenda = Prisma.ItemVendaCreateManyInput;

export type ResultadoGravacao = {
  vendas: { criadas: number; existentes: number };
  itens: { criados: number; existentes: number };
};

/**
 * Grava vendas e itens numa transação: ou entra tudo, ou nada.
 * Registros que já existem (mesmo idSale / idSaleItem) são ignorados,
 * o que torna a gravação idempotente.
 */
export async function gravarVendas(
  vendas: NovaVenda[],
  itens: NovoItemVenda[],
): Promise<ResultadoGravacao> {
  // Vendas antes dos itens: a FK exige que a venda exista.
  const [vendasCriadas, itensCriados] = await db().$transaction([
    db().venda.createMany({ data: vendas, skipDuplicates: true }),
    db().itemVenda.createMany({ data: itens, skipDuplicates: true }),
  ]);

  return {
    vendas: {
      criadas: vendasCriadas.count,
      existentes: vendas.length - vendasCriadas.count,
    },
    itens: {
      criados: itensCriados.count,
      existentes: itens.length - itensCriados.count,
    },
  };
}
