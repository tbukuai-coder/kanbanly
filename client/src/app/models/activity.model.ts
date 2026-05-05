export interface ActivityLog {
  id: number;
  board_id: number;
  card_id: number | null;
  action: string;
  details: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}
