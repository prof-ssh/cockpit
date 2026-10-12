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

// Em desenvolvimento o Next recarrega os módulos a cada alteração; guardar a
// instância no globalThis evita abrir uma conexão nova a cada recarga.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
