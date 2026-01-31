/*
  Warnings:

  - You are about to drop the column `receiptId` on the `ZkReceipt` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ZkReceipt_receiptId_key";

-- AlterTable
ALTER TABLE "ZkReceipt" DROP COLUMN "receiptId";
