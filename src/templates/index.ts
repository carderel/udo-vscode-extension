// Embedded UDO templates
// These are copied when initializing a new project

export function getTemplates(): { [path: string]: string } {
    return {
        'START_HERE.md': START_HERE,
        'ORCHESTRATOR.md': ORCHESTRATOR,
        'COMMANDS.md': COMMANDS,
        'HANDOFF_PROMPT.md': HANDOFF_PROMPT,
        'HARD_STOPS.md': HARD_STOPS,
        'LESSONS_LEARNED.md': LESSONS_LEARNED,
        'NON_GOALS.md': NON_GOALS,
        'OVERSIGHT_DASHBOARD.md': OVERSIGHT_DASHBOARD,
        'PROJECT_STATE.json': PROJECT_STATE,
        'PROJECT_META.json': PROJECT_META,
        'CAPABILITIES.json': CAPABILITIES,
        '.memory/README.md': MEMORY_README,
        '.project-catalog/README.md': CATALOG_README,
        '.project-catalog/sessions/README.md': SESSIONS_README,
        '.inputs/manifest.json': INPUTS_MANIFEST,
        '.rules/code-standards.md': CODE_STANDARDS,
        '.rules/content-guidelines.md': CONTENT_GUIDELINES,
        '.rules/data-validation.md': DATA_VALIDATION,
        '.templates/agent.md': AGENT_TEMPLATE,
        '.templates/session.md': SESSION_TEMPLATE,
        '.templates/handoff.md': HANDOFF_TEMPLATE,
        '.templates/error.md': ERROR_TEMPLATE,
        '.takeover/TAKEOVER_ORCHESTRATOR.md': TAKEOVER_ORCHESTRATOR,
        '.takeover/discovery.json': TAKEOVER_DISCOVERY,
        '.takeover/scope-config.json': TAKEOVER_SCOPE,
    };
}

const START_HERE = `# 🚀 New AI? Start Here.

Welcome to this project. Follow these steps to get oriented:

## Quick Start (60 seconds)

1. **Read your instructions:** \`ORCHESTRATOR.md\`
2. **Check hard stops FIRST:** \`HARD_STOPS.md\` (absolute rules)
3. **Check current status:** \`PROJECT_STATE.json\`
4. **Check for mistakes to avoid:** \`LESSONS_LEARNED.md\`

## Then Say:

> "I've reviewed the project. Current status: [summarize]. Ready to continue with [next steps]."

## Resume Commands

| Command | When to Use |
|---------|-------------|
| \`Resume\` | Start of each session (quick) |
| \`Deep resume\` | After long break, need full context |
| \`Handoff\` | End of session, save progress |

## Key Folders

| Folder | Purpose |
|--------|---------|
| \`.project-catalog/sessions/\` | Session history |
| \`.rules/\` | Project standards |
| \`.agents/\` | Specialist definitions |
`;

const ORCHESTRATOR = `# Universal Dynamic Orchestrator (UDO)

You are **The Architect**, coordinating this project.

---

## SESSION END PROTOCOL (MANDATORY)

Before ending ANY session, create a handoff at \`.project-catalog/sessions/\` with:
- Tags: #topic1 #topic2
- Summary of what was done
- Decisions made
- Next steps
- Files changed

Update PROJECT_STATE.json. Confirm when complete.

---

## SESSION COMMANDS

| User Says | What AI Does |
|-----------|--------------|
| \`Resume\` | Quick resume, give oversight report |
| \`Deep resume\` | Full context with recent sessions |
| \`Handoff\` | Create session handoff |
| \`Quick handoff\` | Minimal handoff |
| \`Status\` | Oversight report |

---

## CORE DIRECTIVES

1. **Hard Stops Are Absolute** - Read HARD_STOPS.md, never violate
2. **Check Lessons** - Read LESSONS_LEARNED.md before starting work
3. **Document Everything** - Log to .project-catalog/
4. **Update State** - Keep PROJECT_STATE.json current
`;

const COMMANDS = `# UDO Commands Reference

## Session Start
| Command | What It Does |
|---------|--------------|
| \`Resume\` | Quick resume with oversight report |
| \`Deep resume\` | Full context with recent sessions |

## Session End
| Command | What It Does |
|---------|--------------|
| \`Handoff\` | Full session handoff |
| \`Quick handoff\` | Minimal handoff |

## Status
| Command | What It Does |
|---------|--------------|
| \`Status\` | Oversight report |
| \`Show blockers\` | List blockers |

## Learning
| Command | What It Does |
|---------|--------------|
| \`Add to lessons\` | Capture correction |
| \`Remember this\` | Add rule |
`;

const HANDOFF_PROMPT = `# Session Handoff

Copy this to AI before ending:

\`\`\`
End session. Create handoff at .project-catalog/sessions/ with:
1. Tags: #topic1 #topic2
2. What we accomplished
3. Decisions made
4. Next steps
5. Files changed

Update PROJECT_STATE.json. Confirm when done.
\`\`\`
`;

const HARD_STOPS = `# Hard Stops

These rules are **ABSOLUTE**. Never violate.

## Security
- **HS-SEC-001**: NEVER include API keys, passwords, or secrets in output
- **HS-SEC-002**: NEVER expose database connection strings

## Data Protection
- **HS-DATA-001**: NEVER store PII in logs

## Client-Specific
<!-- Add project-specific hard stops below -->
`;

const LESSONS_LEARNED = `# Lessons Learned

## Active Lessons

<!-- Format:
### L001: [Title]
- **Priority**: critical | high | normal | low
- **Rule**: What to do
-->

## Archived
| ID | Title | Graduated To | Date |
|----|-------|--------------|------|
`;

const NON_GOALS = `# Non-Goals

UDO is NOT:
- A replacement for human judgment
- An autonomous system
- A security framework
`;

const OVERSIGHT_DASHBOARD = `# Oversight Dashboard

Ask: \`Give me an oversight report\`

## Intervention Commands
| Command | Action |
|---------|--------|
| \`Pause all work\` | Stop |
| \`Show blockers\` | List blockers |
| \`Checkpoint this\` | Manual save |
`;

const PROJECT_STATE = `{
  "goal": "",
  "phase": "initialized",
  "todos": [],
  "in_progress": [],
  "completed": [],
  "blockers": [],
  "notes": "Project initialized. Awaiting goal definition."
}`;

const PROJECT_META = `{
  "name": "",
  "description": "",
  "created": "",
  "tags": []
}`;

const CAPABILITIES = `{
  "environment": "vscode",
  "tools_available": {
    "file_read": true,
    "file_write": true
  },
  "notes": "Update based on your AI capabilities."
}`;

const MEMORY_README = `# Memory System

- \`canonical/\` - Verified facts
- \`working/\` - Current session scratch
- \`disposable/\` - Speculation, delete when resolved
`;

const CATALOG_README = `# Project Catalog

- \`sessions/\` - Session handoffs (START HERE)
- \`decisions/\` - Key decisions
- \`errors/\` - Error tracking
`;

const SESSIONS_README = `# Sessions

Read the most recent file first for continuity.

Each session has Tags: for searching.
`;

const INPUTS_MANIFEST = `{
  "files": [],
  "notes": "Document input files here."
}`;

const CODE_STANDARDS = `# Code Standards

- Write clear, readable code
- Include comments for complex logic
- Handle errors appropriately
`;

const CONTENT_GUIDELINES = `# Content Guidelines

- Professional but approachable tone
- Clear and concise
`;

const DATA_VALIDATION = `# Data Validation

- Verify input before processing
- Log anomalies
`;

const AGENT_TEMPLATE = `# Agent: {NAME}

## Specialization
{Description}

## Learned Rules
<!-- Added when lessons apply to this agent -->
`;

const SESSION_TEMPLATE = `# Session: {DATE}

Tags: #topic1 #topic2

## Summary
{What was accomplished}

## Next Session Should
1. {Priority 1}
2. {Priority 2}
`;

const HANDOFF_TEMPLATE = `# Handoff: {FROM} → {TO}

## Request
{What to do}

## Status
- [ ] Complete
`;

const ERROR_TEMPLATE = `# Error: {TIMESTAMP}

## What Happened
{Description}

## Resolution
{How fixed}
`;

const TAKEOVER_ORCHESTRATOR = `# Takeover Orchestrator

For analyzing and taking over existing projects.

## Phases
1. DISCOVERY - Understand what exists
2. VERIFICATION - Confirm with user
3. AUDIT - Detailed assessment
4. SYNTHESIS - Compile findings
5. TRANSITION - Convert to UDO

Say "Start takeover" to begin.
`;

const TAKEOVER_DISCOVERY = `{
  "status": "pending",
  "project_type": [],
  "tech_stack": {},
  "uncertainties": []
}`;

const TAKEOVER_SCOPE = `{
  "audit_scope": {
    "depth": "standard",
    "exclude_paths": ["node_modules", ".git", "dist"]
  }
}`;
