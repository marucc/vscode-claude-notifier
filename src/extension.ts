import * as vscode from 'vscode';
import { exec } from 'child_process';

// Claude Code のターミナルタイトルは「<マーカー> <セッション名>」形式
// マーカー: Brailleスピナー (U+2800-U+28FF) = 稼働中、✳ = 入力待ち
const WAITING_MARKER = '✳';
const CLAUDE_MARKER_RE = /^[⠀-⣿✳] /;

export function activate(context: vscode.ExtensionContext) {
  const prevStates = new WeakMap<vscode.Terminal, boolean>();
  const activeIds = new Set<string>();

  const project = () =>
    vscode.workspace.name ?? vscode.workspace.workspaceFolders?.[0]?.name ?? 'Unknown';

  // 先頭マーカーを除いた残りで安定したIDを作る
  const idFor = (terminal: vscode.Terminal) =>
    `${project()}::${terminal.name.replace(/^[⠀-⣿✳] /, '')}`;

  const poll = () => {
    for (const terminal of vscode.window.terminals) {
      if (!CLAUDE_MARKER_RE.test(terminal.name)) continue;

      const isWaiting = terminal.name.includes(WAITING_MARKER);
      const prev = prevStates.get(terminal);
      const id = idFor(terminal);

      if (prev === false && isWaiting) {
        notify(id, project());
        activeIds.add(id);
      }
      if (prev === true && !isWaiting) {
        dismiss(id);
        activeIds.delete(id);
      }

      prevStates.set(terminal, isWaiting);
    }
  };

  for (const terminal of vscode.window.terminals) {
    if (CLAUDE_MARKER_RE.test(terminal.name)) {
      prevStates.set(terminal, terminal.name.includes(WAITING_MARKER));
    }
  }

  context.subscriptions.push(
    vscode.window.onDidOpenTerminal(terminal => {
      if (CLAUDE_MARKER_RE.test(terminal.name)) {
        prevStates.set(terminal, terminal.name.includes(WAITING_MARKER));
      }
    })
  );

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
