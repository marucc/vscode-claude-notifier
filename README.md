# vscode-claude-notifier

English | [日本語](README_ja.md)

A VS Code extension that sends a macOS notification when Claude Code is waiting for input.

When several projects are open as macOS native tabs, it lets you notice that Claude Code has finished responding in another window.

## Behavior

- Watches terminal titles every 500ms. A terminal that has shown a title starting with one of Claude Code's own markers (busy `◐`/`◑`, waiting `✳`) is treated as a Claude terminal
- Sends a notification with the project name when the title changes from busy (`◐`/`◑`) to anything else. Even if another app (a PTY wrapper etc.) rewrites the waiting marker, it notifies as soon as Claude is no longer busy
- Does not notify while the window is focused
- Removes the notification when the window gets focus or Claude Code becomes busy again
- Clicking the notification activates the VS Code window (macOS native tab) of that project
- The notification text follows VS Code's display language (English by default, Japanese included)

Notifications are sent through Hammerspoon's `hs.notify`. The extension calls the URL handler with `open -g "hammerspoon://claude-notify?..."` to get persistent notifications, programmatic removal, and focusing the window on click.

## Dependencies

This extension does not work on its own. The following setup is required:

### 1. Hammerspoon

```bash
brew install --cask hammerspoon
```

In System Settings → Notifications → Hammerspoon, allow notifications.

### 2. claude_notify module (Hammerspoon side)

`modules/claude_notify.lua` from [marucc/hammerspoon_tools](https://github.com/marucc/hammerspoon_tools) is required. Load it in `init.lua` and call `init()`:

```lua
local claudeNotify = require("modules.claude_notify")
claudeNotify.init()
```

This module registers the `hammerspoon://claude-notify` URL handler.

## Installation

```bash
npm install
npm run package
code --install-extension vscode-claude-notifier-0.1.0.vsix
```

## Development

```bash
npm run compile   # build
npm run watch     # watch mode
npm test          # build + tests (title detection, l10n bundles; node:test)
npm run package   # create the VSIX
```

## Adding a language

Add `l10n/bundle.l10n.<language>.json` that maps the English text to the translation. `npm test` checks that every bundle has the same keys.

```json
{
  "Claude Code is waiting for input": "Claude Code 入力待ち"
}
```

## Requirements

- macOS
- Hammerspoon (with the claude_notify module)
- Claude Code used in a VS Code terminal

## Not needed where hooks are available

If Claude Code's `Notification` hook is available, this extension is not needed.
Adding the following to `~/.claude/settings.json` gives an equivalent notification.

```json
"hooks": {
  "Notification": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "INPUT=$(cat); PROJ=$(echo \"$INPUT\" | jq -r '.cwd' | xargs basename); osascript -e \"display notification \\\"$PROJ\\\" with title \\\"Claude Code is waiting\\\"\""
        }
      ]
    }
  ]
}
```

This extension is the substitute when user-defined hooks cannot be used, e.g. in enterprise environments where `allowManagedHooksOnly: true` is set.

## License

MIT
