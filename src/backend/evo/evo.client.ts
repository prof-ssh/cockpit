import { env } from "../config/env";

// Cliente da API EVO: só busca e devolve o JSON cru das vendas.
// Validar e converter os registros é trabalho do sync.

const CAMINHO_VENDAS = "/api/v2/sales";
const TAMANHO_PAGINA = 1000;
const MAXIMO_PAGINAS = 1000;
const TIMEOUT_MS = 30_000;
const TENTATIVAS = 3;
const STATUS_TEMPORARIOS = new Set([429, 500, 502, 503, 504]);

const PARAMETROS_FIXOS = {
  showReceivables: "false",
  onlyMembership: "false",
  atLeastMonthly: "false",
  showOnlyActiveMemberships: "false",
};

/** Falha ao falar com a EVO (rede, autenticação, resposta inválida). */
export class EvoError extends Error {}

/**
 * Busca todas as vendas do período (datas AAAA-MM-DD, inclusivas),
 * paginando com take/skip até vir uma página vazia ou HTTP 204.
 */
export async function buscarVendas(inicio: string, fim: string): Promise<unknown[]> {
  const { EVO_BASE_URL, EVO_USERNAME, EVO_PASSWORD } = env();
  const autorizacao =
    "Basic " + Buffer.from(`${EVO_USERNAME}:${EVO_PASSWORD}`).toString("base64");

  const vendas: unknown[] = [];
  const paginasVistas = new Set<string>();

  for (let pagina = 0; pagina < MAXIMO_PAGINAS; pagina++) {
    const url = new URL(CAMINHO_VENDAS, EVO_BASE_URL);
    url.search = new URLSearchParams({
      ...PARAMETROS_FIXOS,
      dateSaleStart: inicio,
      dateSaleEnd: fim,
      take: String(TAMANHO_PAGINA),
      skip: String(vendas.length),
    }).toString();

    const registros = await buscarPagina(url, autorizacao);
    if (registros.length === 0) return vendas;

    // Proteção contra a API devolver a mesma página em loop.
    const assinatura = registros.map((r) => (r as { idSale?: unknown }).idSale).join(",");
    if (paginasVistas.has(assinatura)) {
      throw new EvoError("A EVO repetiu uma página; coleta interrompida para evitar um ciclo.");
    }
    paginasVistas.add(assinatura);
    vendas.push(...registros);
  }
  throw new EvoError("Limite de páginas atingido; a coleta não foi considerada completa.");
}

async function buscarPagina(url: URL, autorizacao: string): Promise<unknown[]> {
  for (let tentativa = 1; ; tentativa++) {
    let resposta: Response;
    try {
      resposta = await fetch(url, {
        headers: { Accept: "application/json", Authorization: autorizacao },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch {
      if (tentativa >= TENTATIVAS) {
        throw new EvoError("Não foi possível conectar à EVO após as tentativas.");
      }
      await esperar(tentativa);
      continue;
    }

    if (resposta.status === 204) return [];
    if (resposta.status === 401 || resposta.status === 403) {
      throw new EvoError(
        `Autenticação recusada pela EVO (HTTP ${resposta.status}). Confira EVO_USERNAME e EVO_PASSWORD.`,
      );
    }
    if (!resposta.ok) {
      if (STATUS_TEMPORARIOS.has(resposta.status) && tentativa < TENTATIVAS) {
        await esperar(tentativa);
        continue;
      }
      throw new EvoError(`Consulta à EVO falhou (HTTP ${resposta.status}).`);
    }

    let corpo: unknown;
    try {
      corpo = await resposta.json();
    } catch {
      throw new EvoError("A EVO devolveu um JSON inválido.");
    }
    if (!Array.isArray(corpo)) {
      throw new EvoError("A EVO deveria devolver uma lista de vendas.");
    }
    return corpo;
  }
}

/** Espera crescente entre tentativas: 1s, 2s, 4s... */
function esperar(tentativa: number) {
  return new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (tentativa - 1)));
}
