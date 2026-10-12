import { syncSchema } from "@/backend/sync/sync.schema";
import { sincronizar } from "@/backend/sync/sync.service";
import { EvoError } from "@/backend/evo/evo.client";

// POST /api/sync  { "periodoInicio": "AAAA-MM-DD", "periodoFim": "AAAA-MM-DD" }
// Resposta: { "criadas": 12, "existentes": 340, "falhas": 0 }
export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "corpo deve ser JSON" }, { status: 400 });
  }

  const entrada = syncSchema.safeParse(corpo);
  if (!entrada.success) {
    const erros = entrada.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return Response.json({ erro: "entrada inválida", detalhes: erros }, { status: 400 });
  }

  try {
    return Response.json(await sincronizar(entrada.data));
  } catch (erro) {
    if (erro instanceof EvoError) {
      return Response.json({ erro: erro.message }, { status: 502 });
    }
    console.error("[sync] erro inesperado:", erro);
    return Response.json({ erro: "erro interno no sync" }, { status: 500 });
  }
}
