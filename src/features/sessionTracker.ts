import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectManager } from '../core/projectManager';

export class SessionTracker {
    private projectManager: ProjectManager;
    private sessionStart: Date | null = null;
    private lastHandoff: Date | null = null;
    private active: boolean = false;

    constructor(projectManager: ProjectManager) {
        this.projectManager = projectManager;
    }

    public startSession(): void {
        this.sessionStart = new Date();
        this.active = true;
        this.lastHandoff = null;
    }

    public endSession(): void {
        this.active = false;
    }

    public isActive(): boolean {
        return this.active;
    }

    public getSessionDuration(): number {
        if (!this.sessionStart) {
            return 0;
        }
        return Date.now() - this.sessionStart.getTime();
    }

    public getSessionDurationFormatted(): string {
        const ms = this.getSessionDuration();
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    }

    public markHandoff(): void {
        this.lastHandoff = new Date();
    }

    public hasRecentHandoff(): boolean {
        if (!this.lastHandoff) {
            return false;
        }
        // Consider "recent" as within last 5 minutes
        return Date.now() - this.lastHandoff.getTime() < 5 * 60 * 1000;
    }

    public async createAutoSave(): Promise<void> {
        const project = this.projectManager.getCurrentProject();
        if (!project) {
            return;
        }

        const sessionsPath = path.join(project.udoPath, '.project-catalog', 'sessions');
        if (!fs.existsSync(sessionsPath)) {
            fs.mkdirSync(sessionsPath, { recursive: true });
        }

        const now = new Date();
        const filename = this.formatDateForFilename(now) + '-auto.md';
        const filePath = path.join(sessionsPath, filename);

        const content = this.generateAutoSaveContent(project, now);
        fs.writeFileSync(filePath, content);

        this.markHandoff();
    }

    private formatDateForFilename(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}-${hours}-${minutes}`;
    }

    private generateAutoSaveContent(project: any, now: Date): string {
        const state = project.state;
        const startTime = this.sessionStart ? this.sessionStart.toISOString() : 'Unknown';
        
        return `# Session: ${this.formatDateForFilename(now)} [AUTO-GENERATED]

Tags: #auto-save

LLM: Unknown (auto-generated on window close)
Started: ${startTime}
Ended: ${now.toISOString()}

## Summary

Auto-generated session save. Full handoff was not performed.

## State at Close

### Phase
${state?.phase || 'Unknown'}

### Goal
${state?.goal || 'Not defined'}

### Todos
${this.formatList(state?.todos)}

### In Progress
${this.formatList(state?.in_progress)}

### Blockers
${this.formatList(state?.blockers)}

## Next Session Should

1. Review this auto-save
2. Verify state is accurate
3. Continue from PROJECT_STATE.json todos

## Note

This handoff was auto-generated because the window closed without a manual handoff.
Run "Deep resume" to fully reconstruct context.
`;
    }

    private formatList(items: any[]): string {
        if (!items || items.length === 0) {
            return 'None';
        }
        return items.map(item => {
            if (typeof item === 'string') {
                return `- ${item}`;
            }
            return `- ${item.title || item.description || JSON.stringify(item)}`;
        }).join('\n');
    }

    public async createQuickHandoff(): Promise<string | null> {
        const project = this.projectManager.getCurrentProject();
        if (!project) {
            return null;
        }

        const sessionsPath = path.join(project.udoPath, '.project-catalog', 'sessions');
        if (!fs.existsSync(sessionsPath)) {
            fs.mkdirSync(sessionsPath, { recursive: true });
        }

        const now = new Date();
        const filename = this.formatDateForFilename(now) + '-handoff.md';
        const filePath = path.join(sessionsPath, filename);

        // For quick handoff, we create a template that the AI should fill in
        // The command will copy this to clipboard for the user to paste to AI
        
        this.markHandoff();
        return filePath;
    }

    public getRecentSessions(count: number = 5): string[] {
        const project = this.projectManager.getCurrentProject();
        if (!project) {
            return [];
        }

        const sessionsPath = path.join(project.udoPath, '.project-catalog', 'sessions');
        if (!fs.existsSync(sessionsPath)) {
            return [];
        }

        return fs.readdirSync(sessionsPath)
            .filter(f => f.endsWith('.md') && f !== 'README.md')
            .sort()
            .reverse()
            .slice(0, count);
    }

    public async searchSessionsByTag(tag: string): Promise<string[]> {
        const project = this.projectManager.getCurrentProject();
        if (!project) {
            return [];
        }

        const sessionsPath = path.join(project.udoPath, '.project-catalog', 'sessions');
        if (!fs.existsSync(sessionsPath)) {
            return [];
        }

        const results: string[] = [];
        const files = fs.readdirSync(sessionsPath)
            .filter(f => f.endsWith('.md') && f !== 'README.md');

        for (const file of files) {
            const content = fs.readFileSync(path.join(sessionsPath, file), 'utf8');
            const tagsMatch = content.match(/Tags: (.*)/);
            if (tagsMatch && tagsMatch[1].toLowerCase().includes(tag.toLowerCase())) {
                results.push(file);
            }
        }

        return results.sort().reverse();
    }
}
