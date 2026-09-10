-- AlterTable
ALTER TABLE "challenge_assignments" ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validationFeedback" TEXT,
ADD COLUMN     "validationRequestedAt" TIMESTAMP(3),
ADD COLUMN     "validationStatus" TEXT NOT NULL DEFAULT 'NOT_REQUESTED';
