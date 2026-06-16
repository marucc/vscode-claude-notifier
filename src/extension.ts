import * as vscode from 'vscode';
import { exec } from 'child_process';

// Claude Code のターミナルタイトルは「<マーカー> <セッション名>」形式
// マーカー: Brailleスピナー (U+2800-U+28FF) = 稼働中、✳ = 入力待ち
const WAITING_MARKER = '✳';
const CLAUDE_MARKER_RE = /^[⠀-⣿✳] /;

let output: vscode.OutputChannel;
let debugEnabled = false;

const log = (msg: string) => {
  if (debugEnabled) output?.appendLine(`[${new Date().toISOString()}] ${msg}`);
};

export function activate(context: vscode.ExtensionContext) {
  output = vscode.window.createOutputChannel('Claude Code Notifier');
  context.subscriptions.push(output);

  const readDebug = () => {
    debugEnabled = vscode.workspace.getConfiguration('claudeCodeNotifier').get<boolean>('debug', false);
  };
  readDebug();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('claudeCodeNotifier.debug')) readDebug();
    })
  );

  const project = () =>
    vscode.workspace.name ?? vscode.workspace.workspaceFolders?.[0]?.name ?? 'Unknown';

  log(`activated project=${project()}`);

  const prevStates = new WeakMap<vscode.Terminal, boolean>();
  const activeIds = new Set<string>();
  const prevNames = new WeakMap<vscode.Terminal, string>();

  // 先頭マーカーを除いた残りで安定したIDを作る
  const idFor = (terminal: vscode.Terminal) =>
    `${project()}::${terminal.name.replace(/^[⠀-⣿✳] /, '')}`;

  const poll = () => {
    for (const terminal of vscode.window.terminals) {
      if (!CLAUDE_MARKER_RE.test(terminal.name)) continue;

      const name = terminal.name;
      const isWaiting = name.includes(WAITING_MARKER);
      const prev = prevStates.get(terminal);
      const id = idFor(terminal);

      if (debugEnabled && prevNames.get(terminal) !== name) {
        log(`name="${name}" isWaiting=${isWaiting} prev=${prev}`);
        prevNames.set(terminal, name);
      }

      if (prev === false && isWaiting) {
        log(`-> notify id=${id}`);
        notify(id, project());
        activeIds.add(id);
      }
      if (prev === true && !isWaiting) {
        log(`-> dismiss id=${id}`);
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
