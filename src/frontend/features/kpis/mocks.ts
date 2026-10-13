// Dados de exemplo da tela de KPIs: os números do docs/kpis-playground.html.
// É o ÚNICO lugar com dado fixo. Sai quando dados.ts passar a chamar as rotas reais.

import type {
  ChurnMensal,
  ContratoAVencer,
  Dias,
  EntradasMensais,
  Previsao,
  Realizado,
  RegistrationKind,
  UltimaColeta,
  Vencimentos,
} from "./tipos";

const HOJE = "2026-10-12";
const MESES = [
  "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04",
  "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10",
];

const ENTRADAS: Record<RegistrationKind, number[]> = {
  enrollment: [38, 30, 62, 55, 48, 41, 39, 35, 44, 47, 42, 17],
  renewal: [52, 49, 58, 55, 57, 54, 56, 53, 58, 60, 59, 24],
  "re-enrollment": [9, 7, 14, 12, 11, 10, 9, 8, 10, 11, 10, 4],
  outras: [6, 8, 5, 4, 6, 5, 7, 5, 6, 6, 5, 2],
};
const VENCERAM = [78, 74, 86, 80, 79, 77, 76, 72, 80, 83, 81, 74];
const SAIRAM = [17, 18, 14, 13, 11, 13, 11, 11, 12, 12, null, null];
const JANELAS: Record<Dias, { total: number; recorrentes: number }> = {
  30: { total: 71, recorrentes: 44 },
  60: { total: 148, recorrentes: 93 },
  90: { total: 219, recorrentes: 138 },
};
/** [período atual, período anterior] */
const REALIZADO: Record<Dias, { entradas: number[]; saidas: number[]; venceram: number[] }> = {
  30: { entradas: [118, 109], saidas: [14, 12], venceram: [83, 80] },
  60: { entradas: [229, 213], saidas: [22, 24], venceram: [163, 152] },
  90: { entradas: [341, 318], saidas: [35, 37], venceram: [235, 228] },
};

const media = (valores: number[]) => valores.reduce((s, v) => s + v, 0) / valores.length;

function somarDias(data: string, dias: number) {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const totalDoMes = (i: number) =>
  ENTRADAS.enrollment[i] + ENTRADAS.renewal[i] + ENTRADAS["re-enrollment"][i] + ENTRADAS.outras[i];

const mesesFechados = MESES.slice(0, -1).map((_, i) => i); // o último está em andamento
const mediaMensalEntradas = media(mesesFechados.slice(-6).map(totalDoMes));
const churnFechado = SAIRAM.map((s, i) => (s == null ? null : s / VENCERAM[i])).filter((c): c is number => c != null);
const churnMedio = media(churnFechado.slice(-6));

const CONTRATOS: ContratoAVencer[] = [
  { idMemberMembership: 9101, idMember: 5101, name: "Juliana Alves", idMembership: 20, nameMembership: "Plano anual", membershipEnd: "2026-10-15", recorrente: false, dias: 3 },
  { idMemberMembership: 9102, idMember: 5102, name: "Marcos Vieira", idMembership: 23, nameMembership: "Plano mensal", membershipEnd: "2026-10-16", recorrente: true, dias: 4 },
  { idMemberMembership: 9103, idMember: 5103, name: "Pedro Henrique Souza", idMembership: 31, nameMembership: "Pilates 2x semana", membershipEnd: "2026-10-18", recorrente: false, dias: 6 },
  { idMemberMembership: 9104, idMember: 5104, name: "Camila Rocha", idMembership: 12, nameMembership: "Plano semestral", membershipEnd: "2026-10-21", recorrente: false, dias: 9 },
  { idMemberMembership: 9105, idMember: 5105, name: "Lucas Ferreira", idMembership: 20, nameMembership: "Plano anual", membershipEnd: "2026-10-24", recorrente: false, dias: 12 },
  { idMemberMembership: 9106, idMember: 5106, name: "Ana Beatriz Nunes", idMembership: 33, nameMembership: "Yoga + spa", membershipEnd: "2026-10-29", recorrente: false, dias: 17 },
  { idMemberMembership: 9107, idMember: 5107, name: "Fernanda Lopes", idMembership: 23, nameMembership: "Plano mensal", membershipEnd: "2026-11-02", recorrente: true, dias: 21 },
  { idMemberMembership: 9108, idMember: 5108, name: "Gustavo Ramos", idMembership: 12, nameMembership: "Plano semestral", membershipEnd: "2026-11-19", recorrente: false, dias: 38 },
  { idMemberMembership: 9109, idMember: 5109, name: "Patrícia Mendes", idMembership: 32, nameMembership: "Pilates 3x semana", membershipEnd: "2026-11-27", recorrente: false, dias: 46 },
  { idMemberMembership: 9110, idMember: 5110, name: "Rodrigo Teixeira", idMembership: 20, nameMembership: "Plano anual", membershipEnd: "2026-12-08", recorrente: false, dias: 57 },
  { idMemberMembership: 9111, idMember: 5111, name: "Beatriz Cardoso", idMembership: 13, nameMembership: "Plano trimestral", membershipEnd: "2026-12-22", recorrente: false, dias: 71 },
  { idMemberMembership: 9112, idMember: 5112, name: "Thiago Moreira", idMembership: 20, nameMembership: "Plano anual", membershipEnd: "2027-01-05", recorrente: false, dias: 85 },
];

export const mockUltimaColeta: UltimaColeta = {
  coleta: {
    id: 41,
    status: "sucesso",
    periodoInicio: "2026-10-09",
    periodoFim: "2026-10-10",
    iniciadaEm: "2026-10-10T18:04:12",
    finalizadaEm: "2026-10-10T18:05:03",
    criadas: 23,
    existentes: 4,
    falhas: 0,
  },
  vendasAte: "2026-10-10",
};

export function mockRealizado(dias: Dias): Realizado {
  const r = REALIZADO[dias];
  const fimAtual = somarDias(HOJE, 1);
  const inicioAtual = somarDias(fimAtual, -dias);
  const totais = (i: number, inicio: string, fim: string) => ({
    inicio,
    fim,
    entradas: r.entradas[i],
    saidas: r.saidas[i],
    saldo: r.entradas[i] - r.saidas[i],
    venceram: r.venceram[i],
    churn: r.saidas[i] / r.venceram[i],
  });
  return {
    dias,
    atual: totais(0, inicioAtual, fimAtual),
    anterior: totais(1, somarDias(inicioAtual, -dias), inicioAtual),
  };
}

export function mockPrevisao(dias: Dias): Previsao {
  const r = REALIZADO[dias];
  const entradas = (mediaMensalEntradas / 30.4) * dias;
  const saidas = JANELAS[dias].total * churnMedio;
  return {
    dias,
    previsto: { entradas, saidas, saldo: entradas - saidas },
    realizado: { entradas: r.entradas[0], saidas: r.saidas[0], saldo: r.entradas[0] - r.saidas[0] },
    base: { mediaMensalEntradas, churnMedio, vencimentos: JANELAS[dias].total },
  };
}

export const mockEntradasMensais: EntradasMensais = {
  ate: HOJE,
  meses: MESES.map((mes, i) => ({
    mes,
    fechado: i < MESES.length - 1,
    porTipo: {
      enrollment: ENTRADAS.enrollment[i],
      renewal: ENTRADAS.renewal[i],
      "re-enrollment": ENTRADAS["re-enrollment"][i],
      outras: ENTRADAS.outras[i],
    },
    total: totalDoMes(i),
  })),
  mediaMensal: mediaMensalEntradas,
};

export const mockChurnMensal: ChurnMensal = {
  meses: MESES.map((mes, i) => ({
    mes,
    venceram: VENCERAM[i],
    sairam: SAIRAM[i],
    churn: SAIRAM[i] == null ? null : SAIRAM[i] / VENCERAM[i],
  })),
  churnMedio,
};

export function mockVencimentos(dias: Dias): Vencimentos {
  const janela = JANELAS[dias];
  return {
    dias,
    total: janela.total,
    recorrentes: janela.recorrentes,
    naoRecorrentes: janela.total - janela.recorrentes,
    saidasPrevistas: janela.total * churnMedio,
    churnMedio,
    anterior: { venceram: REALIZADO[dias].venceram[0], saidas: REALIZADO[dias].saidas[0] },
    contratos: CONTRATOS.filter((c) => c.dias <= dias),
  };
}
