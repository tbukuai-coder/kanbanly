import { Label } from './label.model';

export interface Card {
  id: number;
  column_id: number;
  board_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  position: number;
  labels?: Label[];
  created_at: string;
  updated_at: string;
}

export interface CardMoveRequest {
  column_id: number;
  position: number;
}
