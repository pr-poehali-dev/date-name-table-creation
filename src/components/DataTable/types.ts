export interface TableRow {
  id: string;
  date: string;
  time: string;
  surname: string;
  color: string;
  counter?: number;
  surname2?: string;
  color2?: string;
  counter2?: number;
  linkedId?: string;
}

export interface ReserveItem {
  id: string;
  surname: string;
  color: string;
  counter?: number;
  linkedId?: string;
}

export interface SingleTableProps {
  title: string;
  initialData: TableRow[];
  onDataChange: (data: TableRow[]) => void;
  searchQuery: string;
  onDragFromTable: (item: {surname: string; color: string}, id: string) => void;
  onDragFromTable2: (item: {surname: string; color: string}, id: string) => void;
  onDropToTable: (targetId: string, item: {surname: string; color: string} | null, fromReserve: boolean, draggedId: string | null, toSecondCell?: boolean) => void;
  draggedId: string | null;
  dragOverId: string | null;
  setDragOverId: (id: string | null) => void;
  onDragEnd: () => void;
  onReturnToReserve: (surname: string, color: string, surname2?: string, color2?: string) => void;
}

export interface ColorOption {
  value: string;
  label: string;
  border: string;
  bg: string;
  hover: string;
  text: string;
}
