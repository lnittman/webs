-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "twitterUrl" TEXT;

-- AlterTable
ALTER TABLE "PlayerStats" ADD COLUMN     "redCards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yellowCards" INTEGER NOT NULL DEFAULT 0;
