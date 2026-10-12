# Frontend

Três camadas. Cada uma só importa da camada de baixo:

`src/app` → `features` → `design-system`

| Camada | O que é | Pasta |
|---|---|---|
| Design system | Peças genéricas: tokens (`tokens.css`), componentes do shadcn/ui (`components/ui/`) e os nossos por cima deles (`components/`). Não conhece regra de negócio. | `design-system/` |
| Features | Partes do Cockpit (dashboard, sync...) montadas com peças do design system e dados reais. | `features/` |
| Rotas | Páginas do Next. Só escolhem qual feature mostrar. | `../app/` |

O design system nunca importa de `features/`, `src/app` ou `src/backend`.

Dentro de uma feature, os dados entram por uma camada só: `features/kpis/dados.ts` (uma função
por rota) devolve os tipos de `tipos.ts`. Dado fixo de exemplo só existe em `mocks.ts`.
