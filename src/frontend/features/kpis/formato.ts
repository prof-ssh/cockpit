// Como os números e datas aparecem na tela de KPIs.

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_EXTENSO = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** 1234.6 → "1.235". Negativos com o sinal de menos tipográfico. */
export function num(n: number) {
  const texto = Math.round(Math.abs(n)).toLocaleString("pt-BR");
  return n < 0 && Math.round(n) !== 0 ? `−${texto}` : texto;
}

/** 0.1534 → "15,3%". */
export function pct(taxa: number) {
  return `${(taxa * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** "2026-10" → "out". */
export function mesCurto(mes: string) {
  return MESES[Number(mes.slice(5, 7)) - 1];
}

/** "2026-10" → "out/26". */
export function mesAno(mes: string) {
  return `${mesCurto(mes)}/${mes.slice(2, 4)}`;
}

/** "2026-10-12" → "Outubro de 2026". */
export function mesExtenso(data: string) {
  const nome = MESES_EXTENSO[Number(data.slice(5, 7)) - 1];
  return `${nome[0].toUpperCase()}${nome.slice(1)} de ${data.slice(0, 4)}`;
}

/** "2026-10-15" → "15/10". */
export function diaMes(data: string) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

/** "2026-10-10T18:05:03" → "10/10 às 18:05" (ou "hoje às 18:05"). */
export function quando(dataHora: string, hoje: string) {
  const dia = dataHora.slice(0, 10) === hoje ? "hoje" : diaMes(dataHora);
  return `${dia} às ${dataHora.slice(11, 16)}`;
}

/** Data local de hoje, "AAAA-MM-DD" (não UTC: a academia trabalha no horário local). */
export function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-10-10" + 1 → "2026-10-11". */
export function somarDias(data: string, dias: number) {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
