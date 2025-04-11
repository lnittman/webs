-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hideSharedWarning" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SharedChat" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicAccessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sharedChatId" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SharedWithUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SharedWithUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedChat_chatId_key" ON "SharedChat"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedChat_publicAccessToken_key" ON "SharedChat"("publicAccessToken");

-- CreateIndex
CREATE INDEX "SharedChat_chatId_idx" ON "SharedChat"("chatId");

-- CreateIndex
CREATE INDEX "SharedChat_ownerId_idx" ON "SharedChat"("ownerId");

-- CreateIndex
CREATE INDEX "SharedChat_publicAccessToken_idx" ON "SharedChat"("publicAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "ChatInvite_inviteToken_key" ON "ChatInvite"("inviteToken");

-- CreateIndex
CREATE INDEX "ChatInvite_sharedChatId_idx" ON "ChatInvite"("sharedChatId");

-- CreateIndex
CREATE INDEX "ChatInvite_inviteToken_idx" ON "ChatInvite"("inviteToken");

-- CreateIndex
CREATE INDEX "_SharedWithUsers_B_index" ON "_SharedWithUsers"("B");
