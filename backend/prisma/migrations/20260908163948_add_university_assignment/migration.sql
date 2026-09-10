-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "assignedUniversityId" TEXT;

-- CreateIndex
CREATE INDEX "challenges_assignedUniversityId_idx" ON "challenges"("assignedUniversityId");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_assignedUniversityId_fkey" FOREIGN KEY ("assignedUniversityId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
