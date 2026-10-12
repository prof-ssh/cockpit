import { z } from "zod";

// Corpo do POST /api/sync: { "periodoInicio": "2026-01-01", "periodoFim": "2026-01-31" }
export const syncSchema = z
  .object({
    periodoInicio: z.iso.date({ error: "use o formato AAAA-MM-DD" }),
    periodoFim: z.iso.date({ error: "use o formato AAAA-MM-DD" }),
  })
  .refine((p) => p.periodoInicio <= p.periodoFim, {
    path: ["periodoFim"],
    error: "periodoInicio não pode ser depois de periodoFim",
  });

export type SyncEntrada = z.infer<typeof syncSchema>;
