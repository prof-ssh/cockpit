import { prisma } from "../client";

export type Periodo = { periodoInicio: Date; periodoFim: Date };
export type Contagem = { criadas: number; existentes: number; falhas: number };

/** Registra o início de um sync (status em_andamento) e devolve o id. */
export async function iniciarColeta(periodo: Periodo): Promise<number> {
  const coleta = await prisma.coleta.create({ data: periodo, select: { id: true } });
  return coleta.id;
}

/** Fecha a coleta com sucesso e as quantidades. */
export async function concluirColeta(id: number, contagem: Contagem): Promise<void> {
  await prisma.coleta.update({
    where: { id },
    data: { ...contagem, status: "sucesso", finalizadaEm: new Date() },
  });
}

/** Fecha a coleta com erro e a mensagem. */
export async function falharColeta(id: number, erro: string): Promise<void> {
  await prisma.coleta.update({
    where: { id },
    data: { erro, status: "erro", finalizadaEm: new Date() },
  });
}
