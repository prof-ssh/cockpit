// Contrato dos dados da tela de KPIs: o que cada rota GET devolve (ver docs/kpis.md,
// "Consultas e rotas de API"). As rotas reais vão devolver exatamente estes formatos.
//
// Convenções:
// - Datas sem hora: "AAAA-MM-DD". Mês: "AAAA-MM". Data e hora: ISO 8601.
//   Tudo no horário local da academia, como a EVO manda.
// - Nomes de campo iguais aos do banco e da EVO (registrationKind, idMember,
//   idMemberMembership, nameMembership, membershipEnd...).
// - Taxas (churn) vão de 0 a 1.
// - `null` = ainda não dá para calcular: o dado não existe (contratos da EVO ainda não
//   sincronizados) ou a janela de 45 dias do churn ainda não fechou.

/** Tipo de venda da EVO (`vendas.registrationKind`). Venda sem tipo vira "outras". */
export type RegistrationKind = "enrollment" | "re-enrollment" | "renewal" | "outras";

/** Período das janelas de realizado, previsão e vencimentos. */
export type Dias = 30 | 60 | 90;

/** Status de uma coleta (`coletas.status`). */
export type StatusColeta = "em_andamento" | "sucesso" | "erro";

/** GET /api/coletas/ultima */
export type UltimaColeta = {
  /** Último sync registrado; null se nunca rodou. */
  coleta: {
    id: number;
    status: StatusColeta;
    periodoInicio: string;
    periodoFim: string;
    iniciadaEm: string;
    finalizadaEm: string | null;
    criadas: number;
    existentes: number;
    falhas: number;
  } | null;
  /** Data da venda mais recente no banco (`MAX(vendas.saleDate)`); null se não há vendas. */
  vendasAte: string | null;
};

/** Números de um período do realizado. */
export type TotaisRealizado = {
  inicio: string;
  /** Exclusivo: o período vai de `inicio` até o dia antes de `fim`. */
  fim: string;
  /** Vendas com item de contrato (`itens_venda.idMembership` preenchido). */
  entradas: number;
  /** Contratos que venceram no período e não voltaram em 45 dias. */
  saidas: number | null;
  /** Entradas − saídas. */
  saldo: number | null;
  /** Contratos com `membershipEnd` no período e janela de 45 dias fechada. */
  venceram: number | null;
  /** saidas ÷ venceram. */
  churn: number | null;
};

/** GET /api/kpis/realizado?dias=30 */
export type Realizado = {
  dias: Dias;
  atual: TotaisRealizado;
  /** O mesmo cálculo nos `dias` anteriores, para comparar. */
  anterior: TotaisRealizado;
};

/** GET /api/kpis/previsao?dias=30 */
export type Previsao = {
  dias: Dias;
  previsto: {
    /** mediaMensalEntradas ÷ 30,4 × dias. */
    entradas: number;
    /** vencimentos × churnMedio. */
    saidas: number | null;
    saldo: number | null;
  };
  /** Realizado dos últimos `dias`, para comparar com a previsão. */
  realizado: {
    entradas: number;
    saidas: number | null;
    saldo: number | null;
  };
  /** De onde a previsão saiu (mostrado nos textos de "como calculamos"). */
  base: {
    /** Média mensal de entradas dos 6 últimos meses fechados. */
    mediaMensalEntradas: number;
    /** Média do churn mensal dos 6 últimos meses com janela fechada. */
    churnMedio: number | null;
    /** Contratos com `membershipEnd` nos próximos `dias`. */
    vencimentos: number | null;
  };
};

/** Entradas de um mês, por tipo de venda. */
export type EntradasMes = {
  mes: string;
  /** false = mês em andamento (sem comparação, desenhado à parte). */
  fechado: boolean;
  porTipo: Record<RegistrationKind, number>;
  total: number;
};

/** GET /api/kpis/entradas-mensais?meses=12 */
export type EntradasMensais = {
  /** Último dia considerado (hoje). */
  ate: string;
  /** Do mais antigo para o mais recente. */
  meses: EntradasMes[];
  /** Média mensal dos 6 últimos meses fechados. */
  mediaMensal: number;
};

/** Churn de um mês, pelos contratos que venceram nele. */
export type ChurnMes = {
  mes: string;
  /** Contratos com `membershipEnd` no mês. */
  venceram: number;
  /** null enquanto a janela de 45 dias do mês não fechou. */
  sairam: number | null;
  /** sairam ÷ venceram; null enquanto a janela não fechou. */
  churn: number | null;
};

/** GET /api/kpis/churn-mensal?meses=12 */
export type ChurnMensal = {
  /** Do mais antigo para o mais recente. */
  meses: ChurnMes[];
  /** Média dos 6 últimos meses com janela fechada; null se não há nenhum. */
  churnMedio: number | null;
};

/** Um contrato que vence no período e ainda não tem contrato seguinte. */
export type ContratoAVencer = {
  idMemberMembership: number;
  idMember: number;
  /** Nome do aluno (`name` nos contratos da EVO). */
  name: string;
  idMembership: number;
  nameMembership: string;
  membershipEnd: string;
  /** Renova sozinho (plano com recorrência). */
  recorrente: boolean;
  /** Dias de hoje até `membershipEnd`. */
  dias: number;
};

/** GET /api/kpis/vencimentos?dias=30 */
export type Vencimentos = {
  dias: Dias;
  total: number;
  recorrentes: number;
  naoRecorrentes: number;
  /** total × churnMedio. */
  saidasPrevistas: number | null;
  churnMedio: number | null;
  /** Realizado dos últimos `dias`, para comparar. */
  anterior: {
    venceram: number | null;
    saidas: number | null;
  };
  /** Ordenados por `membershipEnd`. */
  contratos: ContratoAVencer[];
};

/** Corpo e resposta do POST /api/sync (rota que já existe). */
export type PeriodoSync = { periodoInicio: string; periodoFim: string };
export type ResultadoSync = { criadas: number; existentes: number; falhas: number };
