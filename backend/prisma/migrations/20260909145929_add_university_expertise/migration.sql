-- AlterTable
ALTER TABLE "users" ADD COLUMN     "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "researchAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
