-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "JerseyOrder" (
    "id" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "backName" TEXT NOT NULL,
    "backNumber" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "sleeve" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JerseyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLoginAttempt" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JerseyOrder_backName_key" ON "JerseyOrder"("backName");

-- CreateIndex
CREATE UNIQUE INDEX "JerseyOrder_backNumber_key" ON "JerseyOrder"("backNumber");

-- CreateIndex
CREATE INDEX "JerseyOrder_gender_idx" ON "JerseyOrder"("gender");

-- CreateIndex
CREATE INDEX "JerseyOrder_backNumber_idx" ON "JerseyOrder"("backNumber");

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_ip_createdAt_idx" ON "AdminLoginAttempt"("ip", "createdAt");
