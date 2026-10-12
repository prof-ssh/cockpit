// Roda uma vez quando o servidor do Next sobe.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("./backend/config/env");
    env(); // falha na subida se faltar variável
  }
}
