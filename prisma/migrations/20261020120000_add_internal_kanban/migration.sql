-- Additive internal shared Kanban. Apply only through the normal deployment workflow.
CREATE TABLE "KanbanBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KanbanBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KanbanStatus" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KanbanStatus_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "KanbanStatus_position_check" CHECK ("position" >= 0)
);

CREATE TABLE "KanbanCard" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KanbanCard_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "KanbanCard_position_check" CHECK ("position" >= 0)
);

CREATE UNIQUE INDEX "KanbanStatus_id_boardId_key" ON "KanbanStatus"("id", "boardId");
CREATE INDEX "KanbanStatus_boardId_position_idx" ON "KanbanStatus"("boardId", "position");
CREATE INDEX "KanbanCard_boardId_idx" ON "KanbanCard"("boardId");
CREATE INDEX "KanbanCard_statusId_boardId_position_idx" ON "KanbanCard"("statusId", "boardId", "position");
CREATE INDEX "KanbanCard_assigneeId_idx" ON "KanbanCard"("assigneeId");

ALTER TABLE "KanbanStatus" ADD CONSTRAINT "KanbanStatus_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "KanbanBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KanbanCard" ADD CONSTRAINT "KanbanCard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "KanbanBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- The composite FK makes cross-board status assignments impossible, even outside actions.
ALTER TABLE "KanbanCard" ADD CONSTRAINT "KanbanCard_statusId_boardId_fkey" FOREIGN KEY ("statusId", "boardId") REFERENCES "KanbanStatus"("id", "boardId") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "KanbanCard" ADD CONSTRAINT "KanbanCard_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
