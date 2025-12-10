-- AlterTable: Add Haystack semantic tagging fields
ALTER TABLE "Point" ADD COLUMN IF NOT EXISTS "quantity" TEXT;
ALTER TABLE "Point" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "Point" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Point" ADD COLUMN IF NOT EXISTS "qualifier" TEXT;
ALTER TABLE "Point" ADD COLUMN IF NOT EXISTS "dis" TEXT;

-- AlterTable: Add value range validation fields
ALTER TABLE "Point" ADD COLUMN IF NOT EXISTS "minPresValue" DOUBLE PRECISION;
ALTER TABLE "Point" ADD COLUMN IF NOT EXISTS "maxPresValue" DOUBLE PRECISION;
