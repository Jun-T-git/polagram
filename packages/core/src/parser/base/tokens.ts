export interface BaseToken {
  type: string;
  literal: string;
  line: number;
  column: number;
  start: number;
  end: number;
}
