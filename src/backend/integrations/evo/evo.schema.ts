import { z } from "zod";
import type { NovaVenda, NovoItemVenda } from "@/database/repositories/vendas.repository";
import type { Falha, VendaComItens } from "../../domain/vendas";

// Formato de uma venda da EVO e conversão para os tipos do banco
// (ver "Tipos dos campos" em docs/plan.md). Campos que a EVO mandar a mais
// são ignorados; campo obrigatório ausente ou com tipo errado reprova a venda.

type Json = NovaVenda["member"];

const int = z.int();
const intOpc = z.int().nullish().transform((v) => v ?? null);
const texto = z.string();
const textoOpc = z.string().nullish().transform((v) => v ?? null);
const bool = z.boolean();
// Dinheiro como texto: o banco guarda numeric exato, sem erro de float.
const dinheiro = z.number().transform(String);
const dinheiroOpc = z.number().nullish().transform((v) => (v == null ? null : String(v)));
// A EVO manda datas sem fuso, no horário local da academia ("2026-10-07T08:00:00").
// O "Z" faz o valor ser gravado exatamente como veio, sem conversão de fuso.
const data = z.iso.datetime({ local: true }).transform((s) => new Date(`${s}Z`));
const dataOpc = z.iso
  .datetime({ local: true })
  .nullish()
  .transform((s) => (s == null ? null : new Date(`${s}Z`)));
const objeto = z.record(z.string(), z.unknown()).transform((v) => v as Json);
const objetoOpc = z
  .record(z.string(), z.unknown())
  .nullish()
  .transform((v) => (v == null ? undefined : (v as Json)));
// Campos sempre nulos na amostra: aceitam qualquer valor e guardam como JSON.
const qualquer = z.unknown().optional().transform((v) => (v == null ? undefined : (v as Json)));

const itemSchema = z.object({
  idSaleItem: int,
  idSale: int,
  description: texto,
  item: texto,
  itemValue: dinheiro,
  saleValue: dinheiro,
  saleValueWithoutCreditValue: qualquer,
  quantity: int,
  idMembership: intOpc,
  additionalType: qualquer,
  idMembershipRenewed: intOpc,
  numMembers: intOpc,
  idProduct: qualquer,
  idService: intOpc,
  corporatePartnershipName: qualquer,
  coporatePartnershipId: qualquer,
  membershipStartDate: dataOpc,
  discount: dinheiroOpc,
  corporateDiscount: dinheiroOpc,
  tax: dinheiroOpc,
  voucher: textoOpc,
  accountingCode: textoOpc,
  municipalServiceCode: qualquer,
  flReceiptOnly: bool,
  idSaleItemMigration: qualquer,
  flSwimming: bool,
  flAllowLocker: bool,
  idMemberMembership: intOpc,
  valueNextMonth: dinheiroOpc,
}) satisfies z.ZodType<NovoItemVenda, unknown>;

const vendaSchema = z.object({
  idSale: int,
  idMember: intOpc,
  idEmployee: qualquer,
  nameEmployee: qualquer,
  idProspect: intOpc,
  idResponsible: intOpc,
  idMemberResponsible: intOpc,
  cpfResponsible: textoOpc,
  idEmployeeSale: int,
  updateDate: data,
  nameEmployeeSale: texto,
  idCommissionedEmployee: intOpc,
  nameCommissionedEmployee: textoOpc,
  saleDate: data,
  saleDateServer: data,
  timeZone: texto,
  idPersonal: qualquer,
  removed: qualquer,
  idEmployeeRemoval: qualquer,
  removalDate: qualquer,
  idBranch: int,
  observations: textoOpc,
  idSaleRecurrency: intOpc,
  saleSource: intOpc,
  idSaleMigration: qualquer,
  idCartToken: qualquer,
  member: objeto,
  prospect: objetoOpc,
  receivables: qualquer,
  registrationKind: textoOpc,
  saleItens: z.array(itemSchema).nullish().transform((v) => v ?? []),
});

export type VendaConvertida = VendaComItens<NovaVenda, NovoItemVenda>;

/** Valida e converte uma venda crua da EVO. */
export function converterVenda(
  bruta: unknown,
): { ok: true; dados: VendaConvertida } | { ok: false; falha: Falha } {
  const resultado = vendaSchema.safeParse(bruta);
  if (resultado.success) {
    const { saleItens, ...venda } = resultado.data;
    return { ok: true, dados: { venda, itens: saleItens } };
  }

  // Só o primeiro problema e só o caminho do campo, nunca o valor (dados pessoais).
  const [primeiro, ...outros] = resultado.error.issues;
  const caminho = primeiro.path.join(".") || "(venda)";
  const motivo = `${caminho}: ${primeiro.message}` + (outros.length ? ` (+${outros.length})` : "");

  const crua = (bruta ?? {}) as { idSale?: unknown; saleItens?: unknown };
  const [raiz, posicao] = primeiro.path;
  const item =
    raiz === "saleItens" && typeof posicao === "number" && Array.isArray(crua.saleItens)
      ? (crua.saleItens[posicao] as { idSaleItem?: unknown } | undefined)
      : undefined;

  return {
    ok: false,
    falha: { idSale: inteiroOuNulo(crua.idSale), idSaleItem: inteiroOuNulo(item?.idSaleItem), motivo },
  };
}

function inteiroOuNulo(valor: unknown): number | null {
  return Number.isInteger(valor) ? (valor as number) : null;
}
