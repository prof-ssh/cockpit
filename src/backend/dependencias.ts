import { buscarVendasEvo } from "./integrations/evo/evo.fonte";
import { criarSincronizarVendas } from "./use-cases/sincronizar-vendas";
import { criarVerificarSaude } from "./use-cases/verificar-saude";
import { verificarConexao } from "@/database/client";
import { gravarVendas } from "@/database/repositories/vendas.repository";
import {
  concluirColeta,
  falharColeta,
  iniciarColeta,
} from "@/database/repositories/coletas.repository";

// Único lugar que liga os use-cases às peças reais (EVO, banco, console).
// Trocar a fonte de vendas ou o banco é mudar só aqui.

export const sincronizarVendas = criarSincronizarVendas({
  buscarVendas: buscarVendasEvo,
  gravarVendas,
  coletas: { iniciar: iniciarColeta, concluir: concluirColeta, falhar: falharColeta },
  avisar: (mensagem) => console.warn(`[sync] ${mensagem}`),
});

export const verificarSaude = criarVerificarSaude({
  verificarBanco: verificarConexao,
  avisar: (mensagem, erro) => console.error(`[health] ${mensagem}:`, erro),
});
