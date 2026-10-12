import "dotenv/config";
import { defineConfig } from "prisma/config";

// Tudo do banco fica em src/database (ver docs/plan.md).
export default defineConfig({
  schema: "src/database/schema.prisma",
  migrations: {
    path: "src/database/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
