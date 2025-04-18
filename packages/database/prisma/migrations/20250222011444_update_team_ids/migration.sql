/*
  Warnings:

  - You are about to drop the column `season` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `NewsLeagues` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `NewsLeagues` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `NewsPlayers` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `NewsPlayers` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `NewsTeams` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `NewsTeams` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `NewsTransfers` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `NewsTransfers` table. All the data in the column will be lost.
  - You are about to drop the column `nationalTeamId` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Standing` table. All the data in the column will be lost.
  - You are about to drop the column `form` on the `Standing` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Standing` table. All the data in the column will be lost.
  - You are about to drop the column `nationalTeamId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `marketValue` on the `Transfer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamId,season]` on the table `Standing` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[leagueId,shortName]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_nationalTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_nationalTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_playerId_fkey";

-- DropIndex
DROP INDEX "Match_date_idx";

-- DropIndex
DROP INDEX "Match_leagueId_homeTeamId_awayTeamId_date_key";

-- DropIndex
DROP INDEX "Match_leagueId_season_idx";

-- DropIndex
DROP INDEX "Standing_leagueId_season_idx";

-- DropIndex
DROP INDEX "Standing_leagueId_teamId_season_key";

-- DropIndex
DROP INDEX "Transfer_date_idx";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "season";

-- AlterTable
ALTER TABLE "NewsLeagues" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "NewsPlayers" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "NewsTeams" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "NewsTransfers" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "nationalTeamId";

-- AlterTable
ALTER TABLE "Standing" DROP COLUMN "createdAt",
DROP COLUMN "form",
DROP COLUMN "updatedAt",
ALTER COLUMN "season" SET DEFAULT 2024;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "nationalTeamId";

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "marketValue";

-- CreateTable
CREATE TABLE "_NationalTeamToPlayer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NationalTeamToPlayer_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_NationalTeamToPlayer_B_index" ON "_NationalTeamToPlayer"("B");

-- CreateIndex
CREATE INDEX "Match_leagueId_idx" ON "Match"("leagueId");

-- CreateIndex
CREATE INDEX "NewsLeagues_newsId_idx" ON "NewsLeagues"("newsId");

-- CreateIndex
CREATE INDEX "NewsLeagues_leagueId_idx" ON "NewsLeagues"("leagueId");

-- CreateIndex
CREATE INDEX "NewsPlayers_newsId_idx" ON "NewsPlayers"("newsId");

-- CreateIndex
CREATE INDEX "NewsPlayers_playerId_idx" ON "NewsPlayers"("playerId");

-- CreateIndex
CREATE INDEX "NewsTeams_newsId_idx" ON "NewsTeams"("newsId");

-- CreateIndex
CREATE INDEX "NewsTeams_teamId_idx" ON "NewsTeams"("teamId");

-- CreateIndex
CREATE INDEX "NewsTransfers_newsId_idx" ON "NewsTransfers"("newsId");

-- CreateIndex
CREATE INDEX "NewsTransfers_transferId_idx" ON "NewsTransfers"("transferId");

-- CreateIndex
CREATE INDEX "Standing_leagueId_idx" ON "Standing"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "Standing_teamId_season_key" ON "Standing"("teamId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "Team_leagueId_shortName_key" ON "Team"("leagueId", "shortName");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NationalTeamToPlayer" ADD CONSTRAINT "_NationalTeamToPlayer_A_fkey" FOREIGN KEY ("A") REFERENCES "NationalTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NationalTeamToPlayer" ADD CONSTRAINT "_NationalTeamToPlayer_B_fkey" FOREIGN KEY ("B") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
