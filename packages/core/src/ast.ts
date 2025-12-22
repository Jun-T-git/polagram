// packages/core/src/ast.ts

/**
 * Ayatori Abstract Syntax Tree (AST) Definitions
 * Mermaidのテキストを解析し、この構造に変換します。
 */

// ------------------------------------------------------------------
// 1. Root Definition
// ------------------------------------------------------------------

export interface AyatoriRoot {
  kind: 'root';
  meta: {
    version: string;   // ex: "1.0.0"
    source: string;    // ex: "mermaid"
  };
  participants: Participant[];
  events: EventNode[]; // トップレベルのイベント（メッセージやブロック）
}

// ------------------------------------------------------------------
// 2. Participants (登場人物)
// ------------------------------------------------------------------

export interface Participant {
  id: string;          // 内部的なユニークID (ex: "p_1")
  name: string;        // 表示名 (ex: "User")
  alias?: string;      // Mermaid上のエイリアス (ex: "U")
  type: ParticipantType;
}

export type ParticipantType = 'actor' | 'participant' | 'database' | 'boundary' | 'control' | 'entity';

// ------------------------------------------------------------------
// 3. Events (シーケンスの中身)
// ------------------------------------------------------------------

// 全てのイベントノードの直和型 (Discriminated Union)
export type EventNode = 
  | MessageNode 
  | FragmentNode 
  | NoteNode 
  | DividerNode;

// --- A. Message (矢印) ---
export interface MessageNode {
  kind: 'message';
  id: string;
  from: string;        // Participant ID
  to: string;          // Participant ID
  text: string;        // メッセージ本文
  style: {
    line: 'solid' | 'dotted';             // 実線 | 点線
    head: 'arrow' | 'async' | 'open';     // -> | ->> | --
    cross: boolean;                       // x付き (->x) かどうか
  };
  lifecycle?: {
    activateTarget?: boolean;  // 受信側をactivateするか (+)
    deactivateSource?: boolean; // 送信側をdeactivateするか (-)
  };
}

// --- B. Fragment (構造化ブロック: alt, loop, etc) ---
// これが「折りたたみ」の単位になります
export interface FragmentNode {
  kind: 'fragment';
  id: string;
  operator: FragmentOperator;
  branches: FragmentBranch[]; // 分岐のリスト
}

export type FragmentOperator = 'alt' | 'loop' | 'opt' | 'par' | 'critical' | 'break' | 'rect';

export interface FragmentBranch {
  id: string;
  condition: string;    // 分岐条件 (ex: "成功時", "x > 0")
  events: EventNode[];  // 【再帰構造】この分岐の中にあるイベント
}

// --- C. Note (ノート) ---
export interface NoteNode {
  kind: 'note';
  id: string;
  text: string;
  position: 'left' | 'right' | 'over';
  participantIds: string[]; // どの参加者に対するノートか
}

// --- D. Divider (区切り線) ---
export interface DividerNode {
  kind: 'divider';
  id: string;
  text?: string;        // "== 準備フェーズ ==" などのテキスト
}