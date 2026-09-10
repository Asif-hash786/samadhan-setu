-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "aiAnalyzedAt" TIMESTAMP(3),
ADD COLUMN     "aiCategory" TEXT,
ADD COLUMN     "aiExplanation" TEXT,
ADD COLUMN     "aiPriority" TEXT,
ADD COLUMN     "aiStatus" TEXT NOT NULL DEFAULT 'NOT_ANALYZED';
