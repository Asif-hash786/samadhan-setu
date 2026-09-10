-- AlterTable
ALTER TABLE "challenge_assignments" ADD COLUMN     "facultyMentor" TEXT,
ADD COLUMN     "studentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "teamName" TEXT;
