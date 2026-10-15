ALTER TABLE "TreasurerReceipt"
  DROP CONSTRAINT "TreasurerReceipt_registrantId_fkey";

ALTER TABLE "TreasurerReceipt"
  ADD CONSTRAINT "TreasurerReceipt_registrantId_fkey"
  FOREIGN KEY ("registrantId") REFERENCES "JerseyOrder"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
