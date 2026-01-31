-- CreateTable
CREATE TABLE "ZkReceipt" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "nullifier" TEXT NOT NULL,
    "proof" JSONB NOT NULL,
    "publicSignals" JSONB NOT NULL,
    "ephemeralIntentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZkReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZkReceipt_receiptId_key" ON "ZkReceipt"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "ZkReceipt_nullifier_key" ON "ZkReceipt"("nullifier");

-- CreateIndex
CREATE UNIQUE INDEX "ZkReceipt_ephemeralIntentId_key" ON "ZkReceipt"("ephemeralIntentId");

-- AddForeignKey
ALTER TABLE "ZkReceipt" ADD CONSTRAINT "ZkReceipt_ephemeralIntentId_fkey" FOREIGN KEY ("ephemeralIntentId") REFERENCES "EphemeralIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
