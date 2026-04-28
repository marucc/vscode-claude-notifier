# vscode-claude-notifier

Claude Code が入力待ちになったら macOS 通知を送る VS Code 拡張機能。

複数プロジェクトを macOS ネイティブタブで開いている場合に、別ウィンドウで Claude Code が応答完了したことを通知で気づけるようにする。

## 動作

ターミナルタイトルを 500ms ごとに監視し、稼働中（`⠐`/`⠂`）から入力待ち（`✳`）に変化したときにプロジェクト名付きで macOS 通知を発火する。

## インストール

```bash
npm install
npm run package
code --install-extension vscode-claude-notifier-0.1.0.vsix
```

## 開発

```bash
npm run compile   # ビルド
npm run watch     # ウォッチモード
npm run package   # VSIX 生成
```

## 動作条件

- macOS
- VS Code でターミナルを開いて Claude Code を使用していること
