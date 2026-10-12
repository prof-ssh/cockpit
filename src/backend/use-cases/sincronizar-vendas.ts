import { itensPertencemAVenda, removerRepetidas, type VendaComItens } from "../domain/vendas";

// Use-case "sincronizar vendas": os passos, em ordem. Não sabe de HTTP,
// de EVO nem de Prisma: recebe quem busca e quem grava (ver dependencias.ts).

export type Periodo = { periodoInicio: string; periodoFim: string }; // AAAA-MM-DD
export type ResultadoSync = { criadas: number; existentes: number; falhas: number };

export type DependenciasSync<V extends VendaComItens> = {
  buscarVendas(
    inicio: string,
    fim: string,
  ): Promise<{ vendas: V[]; invalidas: { idSale: unknown; motivo: string }[] }>;
  gravarVendas(
    vendas: V["venda"][],
    itens: V["itens"],
  ): Promise<{ vendas: { criadas: number; existentes: number } }>;
  coletas: {
    iniciar(periodo: { periodoInicio: Date; periodoFim: Date }): Promise<number>;
    concluir(id: number, resultado: ResultadoSync): Promise<void>;
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
      // 1. buscar
      const { vendas, invalidas } = await deps.buscarVendas(periodoInicio, periodoFim);
      for (const v of invalidas) deps.avisar(`venda ${String(v.idSale)} ignorada: ${v.motivo}`);

      // 2. aplicar as regras
      const deOutraVenda = vendas.filter((v) => !itensPertencemAVenda(v));
      for (const v of deOutraVenda) deps.avisar(`venda ${v.venda.idSale} ignorada: item de outra venda`);

      const { unicas, conflitantes } = removerRepetidas(vendas.filter(itensPertencemAVenda));
      for (const id of conflitantes) deps.avisar(`venda ${id} ignorada: veio repetida com dados diferentes`);

      // 3. gravar
      const gravacao = await deps.gravarVendas(
        unicas.map((v) => v.venda),
        unicas.flatMap((v) => v.itens),
      );

      // 4. registrar
      const resultado = {
        ...gravacao.vendas,
        falhas: invalidas.length + deOutraVenda.length + conflitantes.length,
      };
      await deps.coletas.concluir(idColeta, resultado);
      return resultado;
    } catch (erro) {
      await deps.coletas.falhar(idColeta, erro instanceof Error ? erro.message : String(erro));
      throw erro;
    }
  };
}
