/**
 * A fonte das vendas (hoje a EVO) não respondeu como devia: rede, autenticação,
 * resposta inválida. Fica no domínio para o HTTP tratar sem conhecer a EVO.
 */
export class FonteIndisponivelError extends Error {}
