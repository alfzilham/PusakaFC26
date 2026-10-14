ALTER TABLE "TreasurerReceipt"
  ADD COLUMN "registrantId" TEXT;

CREATE INDEX "TreasurerReceipt_registrantId_idx"
  ON "TreasurerReceipt"("registrantId");

ALTER TABLE "TreasurerReceipt"
  ADD CONSTRAINT "TreasurerReceipt_registrantId_fkey"
  FOREIGN KEY ("registrantId") REFERENCES "JerseyOrder"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
