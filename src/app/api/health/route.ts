import { connection } from "next/server";
import { verificarSaude } from "@/backend/health/health.service";

// GET /api/health: o app está no ar e conectado ao banco?
export async function GET() {
  await connection(); // sempre na hora da requisição, nunca no build
  const saude = await verificarSaude();
  return Response.json(saude, { status: saude.status === "ok" ? 200 : 503 });
}
