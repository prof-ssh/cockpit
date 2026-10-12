# Cockpit The Senses

## Design
- Antes de criar ou mudar qualquer tela, componente ou prévia, use a skill frontend-design.
  Se ela não estiver instalada, avise antes de começar.
- Componentes são do shadcn/ui, com o tema do The Senses em src/frontend/design-system/tokens.css.
- A cor indica a intenção: Tiffany (primary) = destaque e variação boa; destructive = variação ruim;
  bg-muted com borda tracejada = estimativa. Nunca usar a cor de destaque só para enfeitar.
- Sem sombras, cantos de 4px, títulos em Mustica Pro (font-display).
- Referência visual da tela de KPIs: docs/kpis-playground.html (abra no navegador).
- Plano de implementação dos KPIs: docs/kpis.md.

## Código
- Nunca commitar na main: tudo por branch e pull request.
- Mensagens de commit em português: "feat: ...", "fix: ...", "docs: ...".
- Camadas: src/app → features → design-system. O design system não importa de features, src/app nem src/backend.
- Backend: routes → use-cases → database/repositories. Contas de KPI ficam no banco (SQL), não no navegador.
- Não commitar .env.
