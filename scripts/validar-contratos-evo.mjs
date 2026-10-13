// Investigação do fim do contrato (docs/kpis-validacao.md, seção 4).
// Só lê: EVO (contratos e planos) e o banco local. Não grava nada.
//
// Uso: node scripts/validar-contratos-evo.mjs
// Precisa do .env com EVO_BASE_URL, EVO_USERNAME, EVO_PASSWORD e DATABASE_URL,
// e da chave da EVO com permissão de leitura em /api/v3/membermembership,
// /api/v1/membermembership/{id} e /api/v3/membership.
// Dados pessoais saem mascarados.

import pg from "pg";

process.loadEnvFile(".env");
const { EVO_BASE_URL, EVO_USERNAME, EVO_PASSWORD, DATABASE_URL } = process.env;
const AUTORIZACAO = "Basic " + Buffer.from(`${EVO_USERNAME}:${EVO_PASSWORD}`).toString("base64");
const QUANTIDADE = 20;

async function evo(caminho) {
  const resposta = await fetch(new URL(caminho, EVO_BASE_URL), {
    headers: { Accept: "application/json", Authorization: AUTORIZACAO },
    signal: AbortSignal.timeout(60_000),
  });
  const corpo = resposta.ok && resposta.status !== 204 ? await resposta.json() : null;
  return { status: resposta.status, corpo };
}

const dia = (v) => (v ? String(v).slice(0, 10) : "—");
const mascararNome = (n) => (n ? String(n).trim().split(/\s+/).map((p) => p[0] + "***").join(" ") : n);
const DADOS_PESSOAIS = /name|document|cpf|email|phone|cellphone|telefone|address/i;

/** Copia o objeto trocando valores de campos pessoais por "***" (nomes viram iniciais). */
function mascarar(valor, chave = "") {
  if (Array.isArray(valor)) return valor.map((v) => mascarar(v, chave));
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, mascarar(v, k)]));
  }
  if (valor == null || !DADOS_PESSOAIS.test(chave) || /membership|employee/i.test(chave)) return valor;
  return /^name$|firstName|lastName/i.test(chave) ? mascararNome(valor) : "***";
}

/** Soma a duração do plano ao início e tira 1 dia (contrato de 1 mês: 13/09 a 12/10). */
function fimCalculado(inicio, plano) {
  if (!inicio || !plano?.duration) return null;
  const tipo = String(plano.durationType ?? "").toLowerCase();
  const d = new Date(`${dia(inicio)}T00:00:00Z`);
  if (/m[eê]s|month/.test(tipo)) somarMeses(d, plano.duration);
  else if (/ano|year/.test(tipo)) somarMeses(d, 12 * plano.duration);
  else if (/dia|day/.test(tipo)) d.setUTCDate(d.getUTCDate() + plano.duration);
  else return null; // tipo desconhecido: aparece no relatório para decidir
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Soma meses como o Postgres (interval): 31/01 + 1 mês = 28/02, sem pular para março. */
function somarMeses(d, meses) {
  const diaOriginal = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(diaOriginal, ultimoDia));
}

/** Por que o fim da EVO difere do calculado. */
function motivo(detalhe, calculado) {
  if (!calculado) return "duração do plano desconhecida";
  if (dia(detalhe.endDate) === calculado) return "bateu";
  if (detalhe.cancelDate) return "cancelado";
  if (Array.isArray(detalhe.freezes) && detalhe.freezes.length) return "trancamento";
  const dif = (new Date(dia(detalhe.endDate)) - new Date(calculado)) / 86_400_000;
  if (Math.abs(dif) <= 1) return `diferença de ${dif} dia (regra do último dia)`;
  return `ajuste manual ou outra regra (${dif > 0 ? "+" : ""}${dif} dias)`;
}

// 1. Acesso às rotas
console.log("## 1. Acesso às rotas da EVO\n");
const planos = await evo("/api/v3/membership?take=1000");
const lista = await evo("/api/v3/membermembership?take=3");
console.log(`- /api/v3/membership: HTTP ${planos.status}`);
console.log(`- /api/v3/membermembership: HTTP ${lista.status}`);
if (planos.status !== 200 && lista.status !== 200) {
  console.log("\nSem acesso às rotas de contratos e planos. Libere a chave na EVO e rode de novo.");
  process.exit(1);
}

// 2. Planos e duração
console.log("\n## 2. Planos (duração vem de /api/v3/membership)\n");
const porPlano = new Map((planos.corpo ?? []).map((p) => [p.idMembership, p]));
console.log("| idMembership | Plano | Tipo | durationType | duration | Inativo |");
console.log("|---|---|---|---|---|---|");
for (const p of [...porPlano.values()].sort((a, b) => a.idMembership - b.idMembership)) {
  console.log(`| ${p.idMembership} | ${p.nameMembership} | ${p.membershipType ?? "—"} | ${p.durationType ?? "—"} | ${p.duration ?? "—"} | ${p.inactive ? "sim" : ""} |`);
}

// 3. Exemplo de resposta com o fim pronto
console.log("\n## 3. Exemplo de /api/v3/membermembership (mascarado)\n");
console.log("```json\n" + JSON.stringify(mascarar(lista.corpo?.[0] ?? null), null, 2) + "\n```");

// 4. Os 20 contratos: até 2 por plano, os mais antigos (mais chance de já terem vencido)
const banco = new pg.Client({ connectionString: DATABASE_URL });
await banco.connect();
const { rows } = await banco.query(`
  SELECT "idMemberMembership", "idMembership", "membershipStartDate"
  FROM (SELECT *, row_number() OVER (PARTITION BY "idMembership" ORDER BY "membershipStartDate") n
        FROM itens_venda WHERE "idMemberMembership" IS NOT NULL) x
  WHERE n <= 2 ORDER BY n, "idMembership" LIMIT $1`, [QUANTIDADE]);
await banco.end();

console.log(`\n## 4. Fim calculado x fim da EVO (${rows.length} contratos)\n`);
console.log("| Contrato | Plano | Início | Fim calculado | Fim na EVO | Cancelado em | Trancamentos | Resultado |");
console.log("|---|---|---|---|---|---|---|---|");
const contagem = {};
for (const r of rows) {
  const { status, corpo } = await evo(`/api/v1/membermembership/${r.idMemberMembership}`);
  const detalhe = Array.isArray(corpo) ? corpo[0] : corpo;
  if (status !== 200 || !detalhe) {
    console.log(`| ${r.idMemberMembership} | ${r.idMembership} | ${dia(r.membershipStartDate)} | — | HTTP ${status} | | | sem resposta |`);
    contagem["sem resposta"] = (contagem["sem resposta"] ?? 0) + 1;
    continue;
  }
  const calculado = fimCalculado(detalhe.startDate ?? r.membershipStartDate, porPlano.get(r.idMembership));
  const resultado = motivo(detalhe, calculado);
  const chave = resultado.startsWith("ajuste") ? "ajuste manual ou outra regra" : resultado;
  contagem[chave] = (contagem[chave] ?? 0) + 1;
  console.log(`| ${r.idMemberMembership} | ${r.idMembership} | ${dia(detalhe.startDate)} | ${calculado ?? "—"} | ${dia(detalhe.endDate)} | ${dia(detalhe.cancelDate)} | ${detalhe.freezes?.length ?? 0} | ${resultado} |`);
}

console.log("\n### Resumo\n");
for (const [k, n] of Object.entries(contagem)) console.log(`- ${k}: ${n}`);
