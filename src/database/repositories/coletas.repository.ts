import { db } from "../client";

export type Periodo = { periodoInicio: Date; periodoFim: Date };
export type Contagem = { criadas: number; existentes: number; falhas: number };
export type NovaFalha = { idSale: number | null; idSaleItem: number | null; motivo: string };

/** Registra o início de um sync (status em_andamento) e devolve o id. */
export async function iniciarColeta(periodo: Periodo): Promise<number> {
  const coleta = await db().coleta.create({ data: periodo, select: { id: true } });
  return coleta.id;
}

/** Fecha a coleta com sucesso, as quantidades e as vendas que falharam (tudo ou nada). */
export async function concluirColeta(
  id: number,
  contagem: Contagem,
  falhas: NovaFalha[],
): Promise<void> {
  await db().$transaction([
    db().coleta.update({
      where: { id },
      data: { ...contagem, status: "sucesso", finalizadaEm: new Date() },
    }),
    db().coletaFalha.createMany({ data: falhas.map((f) => ({ ...f, coletaId: id })) }),
  ]);
}

/** Fecha a coleta com erro e a mensagem. */
export async function falharColeta(id: number, erro: string): Promise<void> {
  await db().coleta.update({
    where: { id },
    data: { erro, status: "erro", finalizadaEm: new Date() },
  });
}
