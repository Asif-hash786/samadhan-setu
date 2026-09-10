-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "citizenId" TEXT;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "challenges_citizenId_idx" ON "challenges"("citizenId");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
