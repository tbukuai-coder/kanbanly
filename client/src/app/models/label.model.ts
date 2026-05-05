export interface Label {
  id: number;
  board_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CardLabel {
  card_id: number;
  label_id: number;
}
