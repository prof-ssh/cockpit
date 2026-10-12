# Frontend

Três camadas. Cada uma só importa da camada de baixo:

`src/app` → `features` → `design-system`

| Camada | O que é | Pasta |
|---|---|---|
| Design system | Peças genéricas: tokens (cores, fontes) e componentes (Button, Card...). Não conhece regra de negócio. | `design-system/` |
| Features | Partes do Cockpit (dashboard, sync...) montadas com peças do design system e dados reais. | `features/` |
| Rotas | Páginas do Next. Só escolhem qual feature mostrar. | `../app/` |

O design system nunca importa de `features/`, `src/app` ou `src/backend`.
