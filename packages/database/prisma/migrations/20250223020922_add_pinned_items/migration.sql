-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pinnedLeagues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pinnedPlayers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pinnedTeams" TEXT[] DEFAULT ARRAY[]::TEXT[];
