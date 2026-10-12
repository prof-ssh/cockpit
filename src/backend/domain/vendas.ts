// Regras de negócio das vendas. Código puro: não busca nem grava nada,
// não depende de EVO, banco ou HTTP.

type ComIdSale = { idSale: number };

/** Uma venda com os seus itens. */
export type VendaComItens<V extends ComIdSale = ComIdSale, I extends ComIdSale = ComIdSale> = {
  venda: V;
  itens: I[];
};

/** Todo item precisa pertencer à venda que o contém. */
export function itensPertencemAVenda({ venda, itens }: VendaComItens): boolean {
  return itens.every((item) => item.idSale === venda.idSale);
}

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
