"use client";

import { useCallback, useEffect, useState } from "react";

type Resultado<T> = { para: () => Promise<T>; tentativa: number } & (
  | { ok: true; dados: T }
  | { ok: false; erro: string }
);

export type EstadoDados<T> = {
  /** Os dados mais recentes. Ao trocar o período, continuam na tela até os novos chegarem. */
  dados: T | undefined;
  carregando: boolean;
  erro: string | null;
  tentarDeNovo: () => void;
};

/**
 * Busca os dados de um widget. Passe uma função estável (useCallback): quando ela
 * muda (ex.: trocou de 30 para 60 dias), busca de novo só aquele widget.
 */
export function useDados<T>(buscar: () => Promise<T>): EstadoDados<T> {
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [ultimosDados, setUltimosDados] = useState<T | undefined>(undefined);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    buscar().then(
      (dados) => {
        if (!ativo) return;
        setResultado({ para: buscar, tentativa, ok: true, dados });
        setUltimosDados(dados);
      },
      (erro: unknown) => {
        if (!ativo) return;
        const mensagem = erro instanceof Error ? erro.message : "Não foi possível carregar os dados.";
        setResultado({ para: buscar, tentativa, ok: false, erro: mensagem });
      },
    );
    return () => {
      ativo = false;
    };
  }, [buscar, tentativa]);

  const atual = resultado?.para === buscar && resultado.tentativa === tentativa;
  return {
    dados: ultimosDados,
    carregando: !atual,
    erro: atual && !resultado.ok ? resultado.erro : null,
    tentarDeNovo: useCallback(() => setTentativa((t) => t + 1), []),
  };
}
