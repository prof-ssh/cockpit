import { z } from "zod";

// Variáveis que o backend precisa. Validadas uma vez, na subida do servidor
// (ver src/instrumentation.ts): se faltar alguma, o app não sobe.
const envSchema = z.object({
  EVO_BASE_URL: z.url(),
  EVO_USERNAME: z.string().min(1),
  EVO_PASSWORD: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cache: Env | undefined;

export function env(): Env {
  if (!cache) {
    const resultado = envSchema.safeParse(process.env);
    if (!resultado.success) {
      const faltando = resultado.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${faltando} (ver .env.example)`);
    }
    cache = resultado.data;
  }
  return cache;
}
