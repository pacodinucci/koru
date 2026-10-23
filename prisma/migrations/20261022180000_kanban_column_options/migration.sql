-- Additive defaults preserve existing boards, columns and cards.
ALTER TABLE "KanbanStatus"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "trashedAt" TIMESTAMP(3),
  ADD COLUMN "holdEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KanbanCard" ADD COLUMN "onHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KanbanStatus" ADD CONSTRAINT "KanbanStatus_lifecycle_check"
  CHECK ("archivedAt" IS NULL OR "trashedAt" IS NULL);

CREATE TABLE "KanbanStatusWatch" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "statusId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "KanbanStatusWatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KanbanStatusWatch_statusId_userId_key" ON "KanbanStatusWatch"("statusId", "userId");
CREATE INDEX "KanbanStatusWatch_userId_idx" ON "KanbanStatusWatch"("userId");
CREATE INDEX "KanbanStatusWatch_boardId_idx" ON "KanbanStatusWatch"("boardId");
ALTER TABLE "KanbanStatusWatch" ADD CONSTRAINT "KanbanStatusWatch_statusId_boardId_fkey"
  FOREIGN KEY ("statusId", "boardId") REFERENCES "KanbanStatus"("id", "boardId") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "KanbanStatusWatch" ADD CONSTRAINT "KanbanStatusWatch_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "KanbanNotification" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "statusId" TEXT NOT NULL,
  "cardId" TEXT,
  "userId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "KanbanNotification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KanbanNotification_userId_createdAt_id_idx" ON "KanbanNotification"("userId", "createdAt", "id");
CREATE INDEX "KanbanNotification_boardId_idx" ON "KanbanNotification"("boardId");
ALTER TABLE "KanbanNotification" ADD CONSTRAINT "KanbanNotification_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "KanbanBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KanbanNotification" ADD CONSTRAINT "KanbanNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
