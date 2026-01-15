import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ProjectManager } from './projectManager';

export class ContextManager {
    private projectManager: ProjectManager;

    constructor(projectManager: ProjectManager) {
        this.projectManager = projectManager;
    }

    public async updateContextFile(): Promise<void> {
        const config = vscode.workspace.getConfiguration('udo');
        const contextFilePath = this.resolveContextPath(
            config.get<string>('contextFilePath') || '~/.udo/current-context.md'
        );

        const project = this.projectManager.getCurrentProject();
        if (!project) {
            // Write "no active project" context
            const content = this.generateNoProjectContext();
            this.writeContextFile(contextFilePath, content);
            return;
        }

        const content = await this.generateContext(project.udoPath, project.name);
        this.writeContextFile(contextFilePath, content);
    }

    private resolveContextPath(configPath: string): string {
        return configPath.replace('~', os.homedir());
    }

    private writeContextFile(filePath: string, content: string): void {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content);
    }

    private generateNoProjectContext(): string {
        return `# UDO Context

**Status:** No active project

No UDO project is currently loaded. To initialize UDO for a project:
1. Open a project folder in VS Code
2. Run command: UDO: Initialize Project
`;
    }

    private async generateContext(udoPath: string, projectName: string): Promise<string> {
        const state = this.readJsonFile(path.join(udoPath, 'PROJECT_STATE.json'));
        const meta = this.readJsonFile(path.join(udoPath, 'PROJECT_META.json'));
        
        // Get recent session
        const recentSession = await this.getRecentSession(udoPath);
        
        // Get critical/high priority lessons
        const lessons = await this.getCriticalLessons(udoPath);

        return `# UDO Active Context

**Project:** ${projectName}
**UDO Path:** ${udoPath}

---

## Before Responding

1. **Read HARD_STOPS.md** - These rules are ABSOLUTE, never violate
2. **Check PROJECT_STATE.json** - Current todos and status
3. **Review critical lessons below** - High-priority rules

---

## Current State

**Phase:** ${state?.phase || 'unknown'}
**Goal:** ${state?.goal || 'Not defined'}

### Todos
${this.formatTodos(state?.todos || [])}

### In Progress
${this.formatTodos(state?.in_progress || [])}

### Blockers
${this.formatBlockers(state?.blockers || [])}

---

## Critical Lessons

${lessons || 'No critical or high-priority lessons.'}

---

## Recent Session

${recentSession || 'No recent session found.'}

---

## On Session End

When user says "Handoff", "End session", or conversation ends:
1. Create session log in .project-catalog/sessions/
2. Include Tags: #topic1 #topic2 at the top
3. Update PROJECT_STATE.json
4. Confirm completion

---

## Quick Reference

| Need | Location |
|------|----------|
| Absolute rules | HARD_STOPS.md |
| All commands | COMMANDS.md |
| Full instructions | ORCHESTRATOR.md |
| Project rules | .rules/ |
| Past sessions | .project-catalog/sessions/ |
`;
    }

    private readJsonFile(filePath: string): any {
        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch {
                return null;
            }
        }
        return null;
    }

    private formatTodos(todos: any[]): string {
        if (!todos || todos.length === 0) {
            return 'None';
        }
        return todos.map(t => `- ${t.title || t}`).join('\n');
    }

    private formatBlockers(blockers: any[]): string {
        if (!blockers || blockers.length === 0) {
            return 'None';
        }
        return blockers.map(b => `- ${b.description || b}`).join('\n');
    }

    private async getRecentSession(udoPath: string): Promise<string | null> {
        const sessionsPath = path.join(udoPath, '.project-catalog', 'sessions');
        if (!fs.existsSync(sessionsPath)) {
            return null;
        }

        const files = fs.readdirSync(sessionsPath)
            .filter(f => f.endsWith('.md') && f !== 'README.md')
            .sort()
            .reverse();

        if (files.length === 0) {
            return null;
        }

        const recentFile = files[0];
        const content = fs.readFileSync(path.join(sessionsPath, recentFile), 'utf8');
        
        // Extract summary (first ~500 chars or until ## Next Session)
        const summaryMatch = content.match(/## Summary\n([\s\S]*?)(?=\n##|$)/);
        const tagsMatch = content.match(/Tags: (.*)/);
        
        return `**Last Session:** ${recentFile}
${tagsMatch ? `**Tags:** ${tagsMatch[1]}` : ''}
${summaryMatch ? summaryMatch[1].trim().substring(0, 300) : 'No summary available.'}`;
    }

    private async getCriticalLessons(udoPath: string): Promise<string | null> {
        const lessonsPath = path.join(udoPath, 'LESSONS_LEARNED.md');
        if (!fs.existsSync(lessonsPath)) {
            return null;
        }

        const content = fs.readFileSync(lessonsPath, 'utf8');
        
        // Extract critical and high priority lessons
        const lessons: string[] = [];
        const lessonRegex = /### (L\d+): (.+)\n([\s\S]*?)(?=\n### L\d+|## Archived|$)/g;
        let match;

        while ((match = lessonRegex.exec(content)) !== null) {
            const [, id, title, body] = match;
            if (body.includes('Priority**: critical') || body.includes('Priority**: high')) {
                const priorityMatch = body.match(/\*\*Priority\*\*: (\w+)/);
                const priority = priorityMatch ? priorityMatch[1] : 'unknown';
                const ruleMatch = body.match(/\*\*Rule\*\*: (.+)/);
                const rule = ruleMatch ? ruleMatch[1] : '';
                
                lessons.push(`- **[${priority.toUpperCase()}] ${id}: ${title}**\n  ${rule}`);
            }
        }

        return lessons.length > 0 ? lessons.join('\n\n') : null;
    }

    public async clearContextFile(): Promise<void> {
        const config = vscode.workspace.getConfiguration('udo');
        const contextFilePath = this.resolveContextPath(
            config.get<string>('contextFilePath') || '~/.udo/current-context.md'
        );

        if (fs.existsSync(contextFilePath)) {
            fs.unlinkSync(contextFilePath);
        }
    }
}
