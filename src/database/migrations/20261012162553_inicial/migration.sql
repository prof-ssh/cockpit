-- CreateEnum
CREATE TYPE "StatusColeta" AS ENUM ('em_andamento', 'sucesso', 'erro');

-- CreateTable
CREATE TABLE "vendas" (
    "idSale" INTEGER NOT NULL,
    "idMember" INTEGER,
    "idEmployee" JSONB,
    "nameEmployee" JSONB,
    "idProspect" INTEGER,
    "idResponsible" INTEGER,
    "idMemberResponsible" INTEGER,
    "cpfResponsible" TEXT,
    "idEmployeeSale" INTEGER NOT NULL,
    "updateDate" TIMESTAMP(0) NOT NULL,
    "nameEmployeeSale" TEXT NOT NULL,
    "idCommissionedEmployee" INTEGER,
    "nameCommissionedEmployee" TEXT,
    "saleDate" TIMESTAMP(0) NOT NULL,
    "saleDateServer" TIMESTAMP(0) NOT NULL,
    "timeZone" TEXT NOT NULL,
    "idPersonal" JSONB,
    "removed" JSONB,
    "idEmployeeRemoval" JSONB,
    "removalDate" JSONB,
    "idBranch" INTEGER NOT NULL,
    "observations" TEXT,
    "idSaleRecurrency" INTEGER,
    "saleSource" INTEGER,
    "idSaleMigration" JSONB,
    "idCartToken" JSONB,
    "member" JSONB NOT NULL,
    "prospect" JSONB,
    "receivables" JSONB,
    "registrationKind" TEXT,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("idSale")
);

-- CreateTable
CREATE TABLE "itens_venda" (
    "idSaleItem" INTEGER NOT NULL,
    "idSale" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "itemValue" DECIMAL(12,2) NOT NULL,
    "saleValue" DECIMAL(12,2) NOT NULL,
    "saleValueWithoutCreditValue" JSONB,
    "quantity" INTEGER NOT NULL,
    "idMembership" INTEGER,
    "additionalType" JSONB,
    "idMembershipRenewed" INTEGER,
    "numMembers" INTEGER,
    "idProduct" JSONB,
    "idService" INTEGER,
    "corporatePartnershipName" JSONB,
    "coporatePartnershipId" JSONB,
    "membershipStartDate" TIMESTAMP(0),
    "discount" DECIMAL(12,2),
    "corporateDiscount" DECIMAL(12,2),
    "tax" DECIMAL(12,2),
    "voucher" TEXT,
    "accountingCode" TEXT,
    "municipalServiceCode" JSONB,
    "flReceiptOnly" BOOLEAN NOT NULL,
    "idSaleItemMigration" JSONB,
    "flSwimming" BOOLEAN NOT NULL,
    "flAllowLocker" BOOLEAN NOT NULL,
    "idMemberMembership" INTEGER,
    "valueNextMonth" DECIMAL(12,2),

    CONSTRAINT "itens_venda_pkey" PRIMARY KEY ("idSaleItem")
);

-- CreateTable
CREATE TABLE "coletas" (
    "id" SERIAL NOT NULL,
    "periodoInicio" DATE NOT NULL,
    "periodoFim" DATE NOT NULL,
    "status" "StatusColeta" NOT NULL DEFAULT 'em_andamento',
    "iniciadaEm" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMPTZ(0),
    "criadas" INTEGER NOT NULL DEFAULT 0,
    "existentes" INTEGER NOT NULL DEFAULT 0,
    "falhas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,

    CONSTRAINT "coletas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "itens_venda_idSale_idx" ON "itens_venda"("idSale");

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_idSale_fkey" FOREIGN KEY ("idSale") REFERENCES "vendas"("idSale") ON DELETE RESTRICT ON UPDATE CASCADE;
