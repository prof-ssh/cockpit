// Use-case "verificar saúde": o app está de pé e o banco responde?

export type Saude = { status: "ok" | "erro"; banco: "ok" | "erro" };

export type DependenciasSaude = {
  verificarBanco(): Promise<void>;
  avisar(mensagem: string, erro: unknown): void;
};

export function criarVerificarSaude(deps: DependenciasSaude) {
  return async function verificarSaude(): Promise<Saude> {
    try {
      await deps.verificarBanco();
      return { status: "ok", banco: "ok" };
    } catch (erro) {
      deps.avisar("banco indisponível", erro);
      return { status: "erro", banco: "erro" };
    }
  };
}
