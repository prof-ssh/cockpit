import {
  itemDeOutraVenda,
  removerRepetidas,
  type Falha,
  type VendaComItens,
} from "../domain/vendas";

// Use-case "sincronizar vendas": os passos, em ordem. Não sabe de HTTP,
// de EVO nem de Prisma: recebe quem busca e quem grava (ver dependencias.ts).

export type Periodo = { periodoInicio: string; periodoFim: string }; // AAAA-MM-DD
export type ResultadoSync = { criadas: number; existentes: number; falhas: number };

export type DependenciasSync<V extends VendaComItens> = {
  buscarVendas(inicio: string, fim: string): Promise<{ vendas: V[]; invalidas: Falha[] }>;
  gravarVendas(
    vendas: V["venda"][],
    itens: V["itens"],
  ): Promise<{ vendas: { criadas: number; existentes: number } }>;
  coletas: {
    iniciar(periodo: { periodoInicio: Date; periodoFim: Date }): Promise<number>;
    concluir(id: number, resultado: ResultadoSync, falhas: Falha[]): Promise<void>;
    falhar(id: number, erro: string): Promise<void>;
  };
  avisar(mensagem: string): void;
};

export function criarSincronizarVendas<V extends VendaComItens>(deps: DependenciasSync<V>) {
  return async function sincronizarVendas({ periodoInicio, periodoFim }: Periodo): Promise<ResultadoSync> {
    const idColeta = await deps.coletas.iniciar({
      periodoInicio: new Date(periodoInicio),
      periodoFim: new Date(periodoFim),
    });

    try {
      // 1. buscar (vendas com campo inválido já chegam como falha)
      const { vendas, invalidas } = await deps.buscarVendas(periodoInicio, periodoFim);
      const falhas: Falha[] = [...invalidas];

      // 2. aplicar as regras
      const consistentes: V[] = [];
      for (const v of vendas) {
        const item = itemDeOutraVenda(v);
        if (!item) consistentes.push(v);
        else falhas.push({ idSale: v.venda.idSale, idSaleItem: item.idSaleItem, motivo: "item de outra venda" });
      }

      const { unicas, conflitantes } = removerRepetidas(consistentes);
      for (const idSale of conflitantes) {
        falhas.push({ idSale, idSaleItem: null, motivo: "repetida com dados diferentes" });
      }

      for (const f of falhas) deps.avisar(`venda ${f.idSale ?? "sem idSale"} ignorada: ${f.motivo}`);

      // 3. gravar
      const gravacao = await deps.gravarVendas(
        unicas.map((v) => v.venda),
        unicas.flatMap((v) => v.itens),
      );

      // 4. registrar (contagens + quais falharam)
      const resultado = { ...gravacao.vendas, falhas: falhas.length };
      await deps.coletas.concluir(idColeta, resultado, falhas);
      return resultado;
    } catch (erro) {
      await deps.coletas.falhar(idColeta, erro instanceof Error ? erro.message : String(erro));
      throw erro;
    }
  };
}
