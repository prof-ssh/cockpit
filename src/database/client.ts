import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Conector do banco: o único ponto que cria o PrismaClient.
// Só os repositories importam daqui.

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida (ver .env.example)");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Criado só no primeiro uso, não ao importar: no build da imagem não há DATABASE_URL.
// Guardar no globalThis evita abrir uma conexão nova a cada recarga do `next dev`.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function db(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/** Confere se o banco responde (usado pelo GET /api/health). */
export async function verificarConexao(): Promise<void> {
  await db().$queryRaw`select 1`;
}
