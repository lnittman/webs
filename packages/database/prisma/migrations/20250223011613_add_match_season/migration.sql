/*
  Warnings:

  - You are about to drop the column `agent` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `contractExpires` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `outfitter` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `socialMedia` on the `Player` table. All the data in the column will be lost.
  - You are about to alter the column `marketValue` on the `Player` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `count` on the `PlayerAchievement` table. All the data in the column will be lost.
  - You are about to drop the column `competition` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `minutesPlayed` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `team` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to alter the column `fee` on the `Transfer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pinnedLeagues` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pinnedPlayers` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pinnedTeams` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `NationalTeam` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[playerId,season]` on the table `PlayerStats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `year` to the `PlayerAchievement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minutes` to the `PlayerStats` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `season` on the `PlayerStats` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "PlayerAchievement" DROP CONSTRAINT "PlayerAchievement_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerStats" DROP CONSTRAINT "PlayerStats_playerId_fkey";

-- DropIndex
DROP INDEX "PlayerStats_playerId_season_competition_team_key";

-- DropIndex
DROP INDEX "Team_leagueId_shortName_key";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "season" INTEGER NOT NULL DEFAULT 2024;

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "agent",
DROP COLUMN "contractExpires",
DROP COLUMN "outfitter",
DROP COLUMN "socialMedia",
ALTER COLUMN "marketValue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "PlayerAchievement" DROP COLUMN "count",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PlayerStats" DROP COLUMN "competition",
DROP COLUMN "minutesPlayed",
DROP COLUMN "team",
ADD COLUMN     "minutes" INTEGER NOT NULL,
DROP COLUMN "season",
ADD COLUMN     "season" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Standing" ADD COLUMN     "form" TEXT[];

-- AlterTable
ALTER TABLE "Transfer" ALTER COLUMN "fee" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "pinnedLeagues",
DROP COLUMN "pinnedPlayers",
DROP COLUMN "pinnedTeams",
DROP COLUMN "updatedAt";

-- CreateIndex
CREATE UNIQUE INDEX "NationalTeam_name_key" ON "NationalTeam"("name");

-- CreateIndex
CREATE INDEX "NationalTeam_country_idx" ON "NationalTeam"("country");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_playerId_season_key" ON "PlayerStats"("playerId", "season");

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
