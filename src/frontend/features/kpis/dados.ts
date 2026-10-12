// Camada de busca da tela de KPIs: uma função por rota.
// Hoje devolve os mocks, com um atraso para exercitar o carregamento.
// Para usar as rotas reais, troque o corpo de cada função por buscar("/api/...")
// e mude USANDO_DADOS_DE_EXEMPLO para false. Os widgets não mudam.

import {
  mockChurnMensal,
  mockEntradasMensais,
  mockPrevisao,
  mockRealizado,
  mockUltimaColeta,
  mockVencimentos,
} from "./mocks";
import type {
  ChurnMensal,
  Dias,
  EntradasMensais,
  PeriodoSync,
  Previsao,
  Realizado,
  ResultadoSync,
  UltimaColeta,
  Vencimentos,
} from "./tipos";

/** Mostra o selo "Dados de exemplo" na tela. */
export const USANDO_DADOS_DE_EXEMPLO = true;

const ATRASO_MS = 600;

function exemplo<T>(dados: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(dados)), ATRASO_MS));
}

/** GET numa rota da API; erro com a mensagem que a rota devolver. */
async function buscar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(caminho, { cache: "no-store", ...init });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(corpo?.erro ?? `A rota ${caminho} respondeu ${resposta.status}.`);
  }
  return corpo as T;
}

export function buscarUltimaColeta(): Promise<UltimaColeta> {
  return exemplo(mockUltimaColeta); // buscar("/api/coletas/ultima")
}

export function buscarRealizado(dias: Dias): Promise<Realizado> {
  return exemplo(mockRealizado(dias)); // buscar(`/api/kpis/realizado?dias=${dias}`)
}

export function buscarPrevisao(dias: Dias): Promise<Previsao> {
  return exemplo(mockPrevisao(dias)); // buscar(`/api/kpis/previsao?dias=${dias}`)
}

export function buscarEntradasMensais(): Promise<EntradasMensais> {
  return exemplo(mockEntradasMensais); // buscar("/api/kpis/entradas-mensais?meses=12")
}

export function buscarChurnMensal(): Promise<ChurnMensal> {
  return exemplo(mockChurnMensal); // buscar("/api/kpis/churn-mensal?meses=12")
}

export function buscarVencimentos(dias: Dias): Promise<Vencimentos> {
  return exemplo(mockVencimentos(dias)); // buscar(`/api/kpis/vencimentos?dias=${dias}`)
}

/** POST /api/sync: essa rota já existe, então aqui é de verdade. */
export function sincronizar(periodo: PeriodoSync): Promise<ResultadoSync> {
  return buscar("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(periodo),
  });
}
