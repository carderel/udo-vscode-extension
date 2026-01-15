# UDO - Universal Dynamic Orchestrator

AI project memory and continuity across sessions and LLMs.

## Setup (One Time)

### Step 1: Install Extension

Search "UDO" in VS Code Extensions and install.

### Step 2: Configure Your AI

Add this line to your AI extension's system prompt / custom instructions:

```
Before responding to any request, read ~/.udo/current-context.md for project rules and context.
```

**Where to add it:**

| AI Extension | Location |
|--------------|----------|
| Claude | Settings → Claude → Custom Instructions |
| GitHub Copilot | Settings → Copilot → Custom Instructions |
| Continue | `~/.continue/config.json` → systemMessage |
| Cursor | Settings → AI → System Prompt |

### Step 3: Initialize Your Project

1. Open your project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "UDO: Initialize Project"
4. Press Enter

Done!

## Commands

### Session Commands

| Command | Shortcut | What It Does |
|---------|----------|--------------|
| `UDO: Resume` | `Ctrl+Shift+U R` | Start where you left off |
| `UDO: Deep Resume` | | Full context with history |
| `UDO: Quick Handoff` | `Ctrl+Shift+U H` | Save progress (minimal) |
| `UDO: Full Handoff` | | Save progress (comprehensive) |
| `UDO: Status` | `Ctrl+Shift+U S` | Get project status |

### Project Commands

| Command | What It Does |
|---------|--------------|
| `UDO: Initialize Project` | Set up UDO for current project |
| `UDO: Open UDO Folder` | Browse all UDO files |
| `UDO: Open Rules` | Edit project rules |
| `UDO: Open Hard Stops` | Edit absolute rules |
| `UDO: Add Lesson` | Add a learned rule |
| `UDO: Search Sessions` | Find past sessions by tag |
| `UDO: Takeover Mode` | Analyze existing project |

## How It Works

```
You open project → Extension loads context
        ↓
You talk to AI → AI reads ~/.udo/current-context.md
        ↓
AI follows rules, knows state
        ↓
You close VS Code → Extension auto-saves
        ↓
Next session → AI picks up where you left off
```

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `udo.autoHandoffOnClose` | `true` | Prompt for handoff on close |
| `udo.autoSaveOnClose` | `true` | Auto-save if no handoff |
| `udo.reminderEnabled` | `true` | Periodic save reminders |
| `udo.reminderIntervalMinutes` | `30` | Minutes between reminders |

## File Storage

UDO files are stored in `~/.udo/projects/` to keep your project folder clean.

Your project only gets a tiny `.udo-link` file.

To browse UDO files: Click "Open UDO Folder" in the sidebar.
