// Regras de negócio das vendas. Código puro: não busca nem grava nada,
// não depende de EVO, banco ou HTTP.

type ComIdSale = { idSale: number };
type ItemBase = { idSale: number; idSaleItem: number };

/** Uma venda com os seus itens. */
export type VendaComItens<V extends ComIdSale = ComIdSale, I extends ItemBase = ItemBase> = {
  venda: V;
  itens: I[];
};

/**
 * Todo item precisa pertencer à venda que o contém.
 * Devolve o primeiro item que aponta para outra venda, ou undefined se estiver tudo certo.
 */
export function itemDeOutraVenda<I extends ItemBase>({
  venda,
  itens,
}: VendaComItens<ComIdSale, I>): I | undefined {
  return itens.find((item) => item.idSale !== venda.idSale);
}

/** Uma venda que não pode entrar no banco, para registrar em coleta_falhas. */
export type Falha = { idSale: number | null; idSaleItem: number | null; motivo: string };

/**
 * A mesma venda repetida com dados iguais conta uma vez só.
 * Repetida com dados diferentes: não dá para saber qual vale, então vira falha.
 */
export function removerRepetidas<T extends VendaComItens>(
  vendas: T[],
): { unicas: T[]; conflitantes: number[] } {
  const porId = new Map<number, { venda: T; json: string }>();
  const conflitantes = new Set<number>();

  for (const venda of vendas) {
    const id = venda.venda.idSale;
    const json = JSON.stringify(venda);
    const anterior = porId.get(id);
    if (!anterior) porId.set(id, { venda, json });
    else if (anterior.json !== json) conflitantes.add(id);
  }

  for (const id of conflitantes) porId.delete(id);
  return { unicas: [...porId.values()].map((v) => v.venda), conflitantes: [...conflitantes] };
}
