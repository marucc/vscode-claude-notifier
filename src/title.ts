// Claude Code のターミナルタイトルは「<マーカー> <セッション名>」形式
// ◐/◑ (U+25D0-U+25D1) = 稼働中、✳ = 入力待ち
// 入力待ちのマーカーは別アプリ（PTY ラッパー等）が書き換えることがあるので、
// Claude のターミナルかどうかは Claude Code 本体のマーカーで一度だけ判定し、以降は稼働中かどうかだけを見る
const CLAUDE_TITLE_RE = /^[◐◑✳] /;
const BUSY_TITLE_RE = /^[◐◑] /;

export const isClaudeTitle = (name: string): boolean => CLAUDE_TITLE_RE.test(name);

export const isBusyTitle = (name: string): boolean => BUSY_TITLE_RE.test(name);

// 先頭のマーカー（記号 1 文字）と続く空白を除いたセッション名
export const sessionName = (name: string): string => name.replace(/^\S\s+/u, '');

export type Transition = 'finished' | 'resumed' | null;

// 稼働中 → それ以外 = 応答完了、それ以外 → 稼働中 = 再開
export function transition(prevBusy: boolean | undefined, busy: boolean): Transition {
  if (prevBusy === true && !busy) return 'finished';
  if (prevBusy === false && busy) return 'resumed';
  return null;
}
