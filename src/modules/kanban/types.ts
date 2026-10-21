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
  cards: KanbanCard[];
};

export type KanbanCard = {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  position: number;
};

export type KanbanAssignee = { id: string; name: string };
