import * as vscode from 'vscode';
import { exec } from 'child_process';

// ✳ = 入力待ち、⠐/⠂ = 稼働中（スピナー）
const WAITING_MARKER = '✳';
const CLAUDE_TERMINAL_NAME = 'Claude Code';

export function activate(context: vscode.ExtensionContext) {
  // terminal -> 前回の入力待ち状態（undefined = 初回未記録）
  const prevStates = new WeakMap<vscode.Terminal, boolean>();

  const poll = () => {
    for (const terminal of vscode.window.terminals) {
      if (!terminal.name.includes(CLAUDE_TERMINAL_NAME)) continue;

      const isWaiting = terminal.name.includes(WAITING_MARKER);
      const prev = prevStates.get(terminal);

      // 稼働中 → 入力待ち の変化のみ通知（初回は記録だけ）
      if (prev === false && isWaiting) {
        const project = vscode.workspace.name ?? vscode.workspace.workspaceFolders?.[0]?.name ?? 'Unknown';
        notify(project);
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

  const timer = setInterval(poll, 500);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
}

function notify(project: string) {
  const escaped = project.replace(/"/g, '\\"');
  exec(`osascript -e 'display notification "${escaped}" with title "Claude Code 入力待ち"'`);
}

export function deactivate() {}
