import { connection } from "next/server";
import { verificarSaude } from "../dependencias";

// GET /api/health
export async function GET() {
  await connection(); // sempre na hora da requisição, nunca no build
  const saude = await verificarSaude();
  return Response.json(saude, { status: saude.status === "ok" ? 200 : 503 });
}
