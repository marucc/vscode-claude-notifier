import * as vscode from 'vscode';
import { exec } from 'child_process';

// ✳ = 入力待ち、⠐/⠂ = 稼働中（スピナー）
const WAITING_MARKER = '✳';
const CLAUDE_TERMINAL_NAME = 'Claude Code';

export function activate(context: vscode.ExtensionContext) {
  // terminal -> 前回の入力待ち状態（undefined = 初回未記録）
  const prevStates = new WeakMap<vscode.Terminal, boolean>();
  // 表示中の通知ID（フォーカス時にまとめて消すため）
  const activeIds = new Set<string>();

  const project = () =>
    vscode.workspace.name ?? vscode.workspace.workspaceFolders?.[0]?.name ?? 'Unknown';

  const idFor = (terminal: vscode.Terminal) => `${project()}::${terminal.name.replace(/[⠐⠂✳ ]/g, '')}`;

  const poll = () => {
    for (const terminal of vscode.window.terminals) {
      if (!terminal.name.includes(CLAUDE_TERMINAL_NAME)) continue;

      const isWaiting = terminal.name.includes(WAITING_MARKER);
      const prev = prevStates.get(terminal);
      const id = idFor(terminal);

      // 稼働中 → 入力待ち: 通知発火
      if (prev === false && isWaiting) {
        notify(id, project());
        activeIds.add(id);
      }
      // 入力待ち → 稼働中: 通知消去
      if (prev === true && !isWaiting) {
        dismiss(id);
        activeIds.delete(id);
      }

      prevStates.set(terminal, isWaiting);
    }
  };

  // 起動時に現在の状態を記録（通知しない）
  for (const terminal of vscode.window.terminals) {
    if (terminal.name.includes(CLAUDE_TERMINAL_NAME)) {
      prevStates.set(terminal, terminal.name.includes(WAITING_MARKER));
    }
  }

  // 新しく開いたターミナルも監視対象に追加
  context.subscriptions.push(
    vscode.window.onDidOpenTerminal(terminal => {
      if (terminal.name.includes(CLAUDE_TERMINAL_NAME)) {
        prevStates.set(terminal, terminal.name.includes(WAITING_MARKER));
      }
    })
  );

  // ウィンドウがフォーカスされたら表示中の通知を全て消す
  context.subscriptions.push(
    vscode.window.onDidChangeWindowState(state => {
      if (state.focused) {
        for (const id of activeIds) {
          dismiss(id);
        }
        activeIds.clear();
      }
    })
  );

  const timer = setInterval(poll, 500);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
}

function notify(id: string, project: string) {
  const params = new URLSearchParams({
    action: 'show',
    id,
    title: 'Claude Code 入力待ち',
    msg: project,
  });
  exec(`open -g "hammerspoon://claude-notify?${params}"`);
}

function dismiss(id: string) {
  const params = new URLSearchParams({ action: 'hide', id });
  exec(`open -g "hammerspoon://claude-notify?${params}"`);
}

export function deactivate() {}
