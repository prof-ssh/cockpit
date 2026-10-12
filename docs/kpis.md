# Cockpit KPIs: plano de implementação

Referência visual: [`kpis-playground.html`](kpis-playground.html) (abra no navegador). Versão de 12/10/2026.

## Resumo

A tela de KPIs da prévia vira código em 4 etapas: contratos da EVO no banco, rotas de leitura, componentes e a tela. As entradas já podem ser calculadas com as vendas que temos; churn, vencimentos e saídas previstas dependem da data de fim de cada contrato, que ainda não sincronizamos.

A tela segue a prévia aprovada (playground): faixa Sincronizar dados no topo, Realizado (30/60/90 dias vs período anterior), Previsão (30/60/90 dias), Entradas por tipo, Churn por vencimento e Saídas previstas por vencimento com a lista filtrável.

Todo código segue as camadas do projeto: `src/app` → `features` → `design-system`, e no backend `routes` → `use-cases` → `database/repositories`.

## Dados que faltam: contratos da EVO

Precisamos sincronizar os contratos dos alunos e guardar numa tabela nova, `contratos`. Sem a data de fim não há churn, vencimentos nem saídas previstas.

O que já temos nas vendas e ajuda a ligar as duas coisas: `itens_venda.idMemberMembership` (o contrato do aluno), `idMembership` (o plano), `membershipStartDate` (início) e `idMembershipRenewed` (o contrato que foi renovado). Falta o fim do contrato e se ele renova sozinho.

Tabela proposta (nomes da EVO a confirmar quando virmos a resposta real):

| Coluna | Tipo | Para que serve |
| --- | --- | --- |
| `idMemberMembership` | integer, PK | Mesmo ID que já aparece em `itens_venda` |
| `idMember` | integer | Liga contrato e aluno; usado no churn |
| `idMembership` | integer | Plano |
| `nameMembership` | text | Nome do plano na lista de vencimentos |
| `membershipStart` | timestamp | Início |
| `membershipEnd` | timestamp | Fim: base de vencimentos, churn e previsão |
| `recorrente` | boolean | Renova sozinho (recorrência online) |
| `cancelDate` | timestamp, nulo | Contrato cancelado antes do fim |
| `atualizadoEm` | timestamptz | Quando o sync gravou |

Regra de gravação diferente das vendas: contrato muda (cancela, renova), então o sync faz **upsert** (atualiza se existir), não "ignora se existir".

Para descobrir:

- [ ] Qual rota da EVO lista os contratos com data de fim (ver o Swagger da EVO)
- [ ] Qual campo diz que o contrato é recorrente; testar também `vendas.idSaleRecurrency` (consulta abaixo)
- [ ] Se a rota filtra por período de vencimento ou se é preciso buscar por aluno

```sql
-- idSaleRecurrency indica recorrência?
SELECT "registrationKind", ("idSaleRecurrency" IS NOT NULL) AS tem_recorrencia, COUNT(*)
FROM vendas GROUP BY 1, 2 ORDER BY 1, 2;
```

## Consultas e rotas de API

São 6 rotas de leitura, todas `GET`, cada uma com um use-case e uma função de repositório. As contas ficam no banco (SQL com `$queryRaw` do Prisma), não no navegador.

| Rota | Devolve | Widget | Depende de contratos |
| --- | --- | --- | --- |
| `/api/coletas/ultima` | data do último sync e até que dia vão as vendas | Sincronizar dados | Não |
| `/api/kpis/realizado?dias=30` | entradas, saídas, saldo e churn do período e do período anterior | Realizado | Saídas e churn |
| `/api/kpis/previsao?dias=30` | entradas, saídas e saldo previstos + realizado para comparar | Previsão | Saídas |
| `/api/kpis/entradas-mensais?meses=12` | por mês: total por `registrationKind` | Entradas por tipo | Não |
| `/api/kpis/churn-mensal?meses=12` | por mês: venceram, saíram (nulo se a janela não fechou) | Churn por vencimento | Sim |
| `/api/kpis/vencimentos?dias=30` | total, com e sem recorrência, saídas previstas e a lista | Saídas previstas por vencimento | Sim |

O período anterior é a mesma consulta com as datas deslocadas: últimos 30 dias contra os 30 dias antes deles.

Regras comuns a todas as consultas:

- Entradas contam só itens de contrato: `itens_venda."idMembership" IS NOT NULL`.
- Vendas removidas ficam de fora (`vendas.removed`; confirmar o formato, hoje é JSON sempre nulo).
- Datas estão no horário local da academia, sem fuso: "hoje" é a data local, não UTC.
- Janela de churn: 45 dias depois do fim do contrato.

### Entradas do período

```sql
SELECT COUNT(DISTINCT v."idSale") AS entradas
FROM vendas v
JOIN itens_venda i ON i."idSale" = v."idSale"
WHERE i."idMembership" IS NOT NULL
  AND v.removed IS NULL
  AND v."saleDate" >= $1 AND v."saleDate" < $2;
```

### Entradas por mês e tipo

```sql
SELECT date_trunc('month', v."saleDate") AS mes,
       COALESCE(v."registrationKind", 'outras') AS tipo,
       COUNT(DISTINCT v."idSale") AS vendas
FROM vendas v
JOIN itens_venda i ON i."idSale" = v."idSale"
WHERE i."idMembership" IS NOT NULL AND v.removed IS NULL
  AND v."saleDate" >= date_trunc('month', $1::timestamp) - interval '11 months'
GROUP BY 1, 2 ORDER BY 1, 2;
```

Tipos: `enrollment` = Nova venda, `re-enrollment` = Rematrícula, `renewal` = Renovação, nulo = Outras vendas.

### Churn por vencimento

Um contrato "saiu" quando venceu e o mesmo aluno não tem outro contrato começando até 45 dias depois do fim. Renovação antecipada conta como renovou.

```sql
SELECT COUNT(*) AS venceram,
       COUNT(*) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM contratos n
         WHERE n."idMember" = c."idMember"
           AND n."membershipStart" > c."membershipStart"
           AND n."membershipStart" <= c."membershipEnd" + interval '45 days'
       )) AS sairam
FROM contratos c
WHERE c."membershipEnd" >= $1 AND c."membershipEnd" < $2
  AND c."membershipEnd" + interval '45 days' <= $3;  -- $3 = hoje: só janelas fechadas
```

Churn = `sairam / venceram`. Na versão mensal, agrupar por `date_trunc('month', c."membershipEnd")` e devolver `sairam` nulo quando a janela do mês ainda não fechou.

### Vencimentos dos próximos N dias

Contratos que vencem no período e ainda não têm um contrato seguinte (quem já renovou não entra).

```sql
SELECT c."idMemberMembership", c."idMember", c."nameMembership",
       c."membershipEnd", c.recorrente,
       (c."membershipEnd"::date - $1::date) AS dias
FROM contratos c
WHERE c."membershipEnd" >= $1 AND c."membershipEnd" < $1::date + $2::int
  AND c."cancelDate" IS NULL
  AND NOT EXISTS (SELECT 1 FROM contratos n
                  WHERE n."idMember" = c."idMember" AND n."membershipStart" > c."membershipStart")
ORDER BY c."membershipEnd";
```

O nome do aluno vem de `vendas.member` (JSON) ou da própria resposta de contratos; confirmar a chave.

### Previsão

Sem consulta nova: usa as anteriores.

- Entradas previstas = média mensal de entradas dos 6 últimos meses fechados ÷ 30,4 × N.
- Churn médio = média do churn mensal dos 6 últimos meses com janela fechada.
- Saídas previstas = vencimentos dos próximos N dias × churn médio.
- Saldo previsto = entradas previstas − saídas previstas.
- Comparação: com o realizado dos últimos N dias.

## Componentes

Os componentes vêm do shadcn/ui e ficam no design system. Por cima deles criamos 6 componentes genéricos nossos e, em `features/kpis`, os 6 widgets da tela.

### Configurar o shadcn

- `npx shadcn@latest init` com o `components.json` apontando para `src/frontend/design-system/components/ui` (componentes) e `src/frontend/design-system/lib/utils.ts` (o `cn`).
- Os tokens passam a usar os nomes do shadcn em `tokens.css`: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1` a `--chart-5`, `--radius`. Valores da marca: os mesmos do playground.
- Ajustes da marca nos componentes: sem sombras, `--radius: 0.25rem`, títulos de card em `font-display` (Outfit, do Google Fonts, carregada pelo `next/font`).
- Os 4 componentes atuais (Button, Card, Input, Badge) são substituídos pelos do shadcn.

Instalar: `card` `button` `badge` `input` `label` `table` `tabs` `toggle-group` `tooltip` `popover` `command` `checkbox` `separator` `chart`.

### Componentes genéricos nossos (design system)

Não conhecem regra de negócio; recebem números e textos prontos.

| Componente | O que faz | Props principais |
| --- | --- | --- |
| `Metric` | Rótulo, ícone de info, número grande e uma linha de apoio | `label`, `value`, `info?`, `children?` |
| `Variation` | Etiqueta com seta e % contra o período anterior; cor diz se foi bom (Tiffany) ou ruim (`destructive`) | `current`, `previous`, `better: "higher" \| "lower"`, `format: "percent" \| "points"`, `label` |
| `VariationInline` | Mesma ideia, compacta, para listas | igual a `Variation`, sem `label` |
| `PeriodToggle` | ToggleGroup 30 / 60 / 90 dias no cabeçalho do card | `value`, `onValueChange` |
| `InfoTooltip` | Ícone ⓘ com o Tooltip do shadcn, abre no mouse, foco ou toque | `children` (o texto) |
| `FacetedFilter` | Botão tracejado da barra da tabela que abre Popover + Command com opções, contagens e Limpar filtro | `title`, `options[{value,label,count}]`, `selected`, `onChange` |

Regras visuais que vêm da prévia:

- Seta só na comparação, nunca no número grande; sem palavras "melhor/pior", a cor basta.
- Previsão é estimativa: card com `bg-muted` e borda tracejada, nunca a cor de destaque.
- Meses ou períodos ainda abertos: hachurados no gráfico e sem comparação.

### Widgets da tela (`src/frontend/features/kpis`)

| Widget | Rota que usa | Componentes |
| --- | --- | --- |
| `SyncCard` | `/api/coletas/ultima`, `POST /api/sync` | Card, Input, Label, Button |
| `RealizadoCard` | `/api/kpis/realizado` | Card, PeriodToggle, Metric, Variation, InfoTooltip |
| `PrevisaoCard` | `/api/kpis/previsao` | Card, PeriodToggle, Metric, Variation, InfoTooltip |
| `EntradasPorTipo` | `/api/kpis/entradas-mensais` | Card, Chart (barras empilhadas + linha de tendência), Variation, VariationInline |
| `ChurnPorVencimento` | `/api/kpis/churn-mensal` | Card, Chart (barras + linha da média), Variation |
| `VencimentosCard` | `/api/kpis/vencimentos` | Card, PeriodToggle, Metric, VariationInline, FacetedFilter, Table, Badge |

Cada widget busca os próprios dados, então trocar 30/60/90 recarrega só aquele card. A página `src/app/kpis/page.tsx` só monta os widgets. Os textos dos tooltips (cálculo e campos) estão no playground e vão junto.

## Regra de design: skill frontend-design

Toda tela, componente ou prévia é feita com a skill **frontend-design**. A regra está no `CLAUDE.md` da raiz do repo, que o Claude lê sempre que trabalha nele. No terminal, confira se a skill está instalada com `/plugin` (ela vem no plugin frontend-design da Anthropic).

## Etapas e decisões em aberto

Cada etapa vira uma branch e um pull request. As etapas 2 e 3 podem andar juntas; a tela só fecha quando as duas terminarem.

1. **Contratos da EVO.** Descobrir a rota, criar a tabela `contratos` (migration), o repositório com upsert e incluir os contratos no `POST /api/sync`. Pronto quando um sync grava contratos com data de fim.
2. **Rotas de leitura.** As 6 rotas da seção de consultas, com use-cases e testes das contas (janela de 45 dias, período anterior, mês em andamento).
3. **shadcn e componentes.** `shadcn init`, tokens com os nomes do shadcn, troca dos 4 componentes atuais e os 6 componentes genéricos.
4. **Tela de KPIs.** Os 6 widgets em `features/kpis` e a página, seguindo o playground.
5. **Conferência.** Comparar 2 ou 3 números com a EVO (como na 3.7) e rodar `npm run lint` e `npm run build`.

Decisões em aberto:

- [ ] Saldo: entradas incluem renovações; para medir crescimento de alunos, usar (novas vendas + rematrículas) − saídas?
- [ ] Previsão de saídas separada por recorrência (churn de quem tem e de quem não tem)?
- [ ] Contrato cancelado antes do fim conta como saída na data do cancelamento?
- [ ] Cor de erro (`destructive`): aprovar o vermelho #c62828 (claro) e #ff8a80 (escuro)
