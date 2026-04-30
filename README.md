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

## フックが使える環境では不要

Claude Code の `Notification` フックが使える環境では、この拡張機能は不要。
`~/.claude/settings.json` に以下を追加すれば同等の通知が実現できる。

```json
"hooks": {
  "Notification": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "INPUT=$(cat); PROJ=$(echo \"$INPUT\" | jq -r '.cwd' | xargs basename); osascript -e \"display notification \\\"$PROJ\\\" with title \\\"Claude Code 入力待ち\\\"\""
        }
      ]
    }
  ]
}
```

エンタープライズ環境など `allowManagedHooksOnly: true` が設定されていてユーザー定義フックが使えない場合に、この拡張機能で代替する。
