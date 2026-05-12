-- CreateTable
CREATE TABLE "InternalMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InternalMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InternalMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InternalMessage_recipientId_createdAt_idx" ON "InternalMessage"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalMessage_senderId_createdAt_idx" ON "InternalMessage"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalMessage_recipientId_readAt_idx" ON "InternalMessage"("recipientId", "readAt");
