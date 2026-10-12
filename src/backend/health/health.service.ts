import { verificarConexao } from "@/database/client";

export type Saude = { status: "ok" | "erro"; banco: "ok" | "erro" };

export async function verificarSaude(): Promise<Saude> {
  try {
    await verificarConexao();
    return { status: "ok", banco: "ok" };
  } catch (erro) {
    console.error("[health] banco indisponível:", erro);
    return { status: "erro", banco: "erro" };
  }
}
