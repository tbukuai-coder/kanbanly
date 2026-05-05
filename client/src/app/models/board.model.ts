import { BoardColumn } from './column.model';
import { Card } from './card.model';
import { Label } from './label.model';
import { CardLabel } from './label.model';

export interface Board {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoardDetail extends Board {
  columns: BoardColumn[];
  cards: Card[];
  labels: Label[];
  cardLabels: CardLabel[];
}
