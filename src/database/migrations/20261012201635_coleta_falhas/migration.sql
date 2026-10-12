-- CreateEnum
CREATE TYPE "StatusFalha" AS ENUM ('pendente', 'resolvida');

-- CreateTable
CREATE TABLE "coleta_falhas" (
    "id" SERIAL NOT NULL,
    "coletaId" INTEGER NOT NULL,
    "idSale" INTEGER,
    "idSaleItem" INTEGER,
    "motivo" TEXT NOT NULL,
    "status" "StatusFalha" NOT NULL DEFAULT 'pendente',
    "criadaEm" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidaEm" TIMESTAMPTZ(0),

    CONSTRAINT "coleta_falhas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coleta_falhas_coletaId_idx" ON "coleta_falhas"("coletaId");

-- CreateIndex
CREATE INDEX "coleta_falhas_idSale_idx" ON "coleta_falhas"("idSale");

-- AddForeignKey
ALTER TABLE "coleta_falhas" ADD CONSTRAINT "coleta_falhas_coletaId_fkey" FOREIGN KEY ("coletaId") REFERENCES "coletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
