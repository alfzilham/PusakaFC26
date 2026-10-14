CREATE TABLE "TreasurerReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "imageUrl" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "TreasurerReceipt_createdAt_idx" ON "TreasurerReceipt"("createdAt");
CREATE INDEX "TreasurerReceipt_phoneNumber_idx" ON "TreasurerReceipt"("phoneNumber");
