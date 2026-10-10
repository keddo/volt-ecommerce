-- AlterTable
ALTER TABLE "Cart" ADD COLUMN "couponCode" TEXT;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "CartItem" ALTER COLUMN "unitPrice" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
