/*
  Warnings:

  - You are about to drop the column `assignedUniversityId` on the `challenges` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "challenges" DROP CONSTRAINT "challenges_assignedUniversityId_fkey";

-- DropIndex
DROP INDEX "challenges_assignedUniversityId_idx";

-- AlterTable
ALTER TABLE "challenges" DROP COLUMN "assignedUniversityId";

-- CreateTable
CREATE TABLE "challenge_assignments" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "proposal" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "challenge_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_assignments_challengeId_idx" ON "challenge_assignments"("challengeId");

-- CreateIndex
CREATE INDEX "challenge_assignments_universityId_idx" ON "challenge_assignments"("universityId");

-- CreateIndex
CREATE INDEX "challenge_assignments_status_idx" ON "challenge_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_assignments_challengeId_universityId_key" ON "challenge_assignments"("challengeId", "universityId");

-- AddForeignKey
ALTER TABLE "challenge_assignments" ADD CONSTRAINT "challenge_assignments_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_assignments" ADD CONSTRAINT "challenge_assignments_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
