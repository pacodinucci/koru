export type KanbanBoardSummary = {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
};

export type KanbanBoard = {
  id: string;
  name: string;
  description: string | null;
  statuses: KanbanStatus[];
};

export type KanbanStatus = {
  id: string;
  name: string;
  color: string;
  position: number;
  archivedAt: string | null;
  trashedAt: string | null;
  holdEnabled: boolean;
  watching: boolean;
  watchers: KanbanAssignee[];
  cards: KanbanCard[];
};

export type KanbanCard = {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  onHold: boolean;
  position: number;
};

export type KanbanAssignee = { id: string; name: string };

export type KanbanNotification = {
  id: string;
  boardId: string;
  statusId: string;
  cardId: string | null;
  message: string;
  createdAt: string;
  readAt: string | null;
};
