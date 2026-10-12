import * as vscode from 'vscode';
import { exec } from 'child_process';
import { isClaudeTitle, isBusyTitle, sessionName, transition } from './title';
import { MESSAGES } from './messages';

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

  // Claude Code 本体のタイトルを一度でも出したターミナルの、前回の稼働中状態
  const prevBusy = new WeakMap<vscode.Terminal, boolean>();
  // 表示中の通知 ID（タイトル変更で ID がずれないよう、通知した時点の ID をターミナルごとに保持）
  const notifiedIds = new WeakMap<vscode.Terminal, string>();
  const activeIds = new Set<string>();
  const prevNames = new WeakMap<vscode.Terminal, string>();

  const idFor = (terminal: vscode.Terminal) => `${project()}::${sessionName(terminal.name)}`;

  // Claude のターミナルとして記録する（記録済みなら何もしない）
  const track = (terminal: vscode.Terminal): boolean => {
    if (prevBusy.has(terminal)) return true;
    if (!isClaudeTitle(terminal.name)) return false;
    prevBusy.set(terminal, isBusyTitle(terminal.name));
    log(`[track] name="${terminal.name}"`);
    return false;
  };

  const poll = () => {
    for (const terminal of vscode.window.terminals) {
      const name = terminal.name;

      // デバッグ時は全ターミナルのタイトル変化を記録
      if (debugEnabled && prevNames.get(terminal) !== name) {
        log(`[all] name="${name}"`);
        prevNames.set(terminal, name);
      }

      // 初めて見つけたターミナルは記録だけして次回から状態変化を見る
      if (!track(terminal)) continue;

      const busy = isBusyTitle(name);
      const change = transition(prevBusy.get(terminal), busy);
      prevBusy.set(terminal, busy);

      if (change === 'finished') {
        // ウィンドウを見ているなら通知は不要
        if (vscode.window.state.focused) {
          log(`-> skip notify (window focused) name="${name}"`);
          continue;
        }
        const id = idFor(terminal);
        log(`-> notify id=${id}`);
        notify(id, project());
        notifiedIds.set(terminal, id);
        activeIds.add(id);
      }
      if (change === 'resumed') {
        const id = notifiedIds.get(terminal);
        if (!id) continue;
        log(`-> dismiss id=${id}`);
        dismiss(id);
        notifiedIds.delete(terminal);
        activeIds.delete(id);
      }
    }
  };

  for (const terminal of vscode.window.terminals) track(terminal);

  context.subscriptions.push(vscode.window.onDidOpenTerminal(track));

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
    title: vscode.l10n.t(MESSAGES.waitingTitle),
    msg: project,
  });
  exec(`open -g "hammerspoon://claude-notify?${params}"`);
}

function dismiss(id: string) {
  const params = new URLSearchParams({ action: 'hide', id });
  exec(`open -g "hammerspoon://claude-notify?${params}"`);
}

export function deactivate() {}
