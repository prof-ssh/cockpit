import { sincronizarVendas } from "../dependencias";
import { FonteIndisponivelError } from "../domain/erros";
import { syncSchema } from "./sync.schema";

// POST /api/sync  { "periodoInicio": "AAAA-MM-DD", "periodoFim": "AAAA-MM-DD" }
// Traduz HTTP ↔ use-case: valida a entrada e escolhe o status da resposta.
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
    return Response.json(await sincronizarVendas(entrada.data));
  } catch (erro) {
    if (erro instanceof FonteIndisponivelError) {
      return Response.json({ erro: erro.message }, { status: 502 });
    }
    console.error("[sync] erro inesperado:", erro);
    return Response.json({ erro: "erro interno no sync" }, { status: 500 });
  }
}
