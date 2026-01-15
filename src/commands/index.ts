import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectManager } from './core/projectManager';
import { ContextManager } from './core/contextManager';
import { SessionTracker } from './features/sessionTracker';

export function registerCommands(
    context: vscode.ExtensionContext,
    projectManager: ProjectManager,
    contextManager: ContextManager,
    sessionTracker: SessionTracker
): void {
    // Initialize Project
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.initialize', async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const projectPath = workspaceFolders[0].uri.fsPath;
            
            try {
                await projectManager.initializeProject(projectPath);
                await contextManager.updateContextFile();
                sessionTracker.startSession();
                
                vscode.window.showInformationMessage(
                    'UDO initialized! Add this to your AI\'s custom instructions:\n\n' +
                    'Before responding, read ~/.udo/current-context.md for project context.',
                    'Copy to Clipboard'
                ).then(selection => {
                    if (selection === 'Copy to Clipboard') {
                        vscode.env.clipboard.writeText(
                            'Before responding to any request, read ~/.udo/current-context.md for project rules and context.'
                        );
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to initialize UDO: ${error}`);
            }
        })
    );

    // Resume
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.resume', async () => {
            const prompt = `Resume

Read the UDO context and give me an oversight report. What's the current status and what should we work on?`;
            
            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage('Resume prompt copied to clipboard. Paste it to your AI.');
        })
    );

    // Deep Resume
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.deepResume', async () => {
            const project = projectManager.getCurrentProject();
            const sessionsPath = project ? path.join(project.udoPath, '.project-catalog', 'sessions') : '';
            
            const prompt = `Deep resume

Read the UDO context at ${project?.udoPath || '~/.udo/projects/[current]'}.

Then read the last 3 session files in ${sessionsPath} for recent history.

Give me:
1. Current project status
2. Summary of recent sessions
3. What we should focus on next`;
            
            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage('Deep resume prompt copied to clipboard. Paste it to your AI.');
        })
    );

    // Quick Handoff
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.quickHandoff', async () => {
            const prompt = `End session. Create handoff at .project-catalog/sessions/ covering:
1. What we did
2. What decisions were made
3. Any blockers
4. What's next
5. Files changed

Add Tags: #topic1 #topic2 at the top.
Update PROJECT_STATE.json.
Confirm when done.`;
            
            await vscode.env.clipboard.writeText(prompt);
            sessionTracker.markHandoff();
            vscode.window.showInformationMessage('Quick handoff prompt copied to clipboard. Paste it to your AI.');
        })
    );

    // Full Handoff
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.fullHandoff', async () => {
            const project = projectManager.getCurrentProject();
            
            const prompt = `You are preparing a context handoff between two AI agents.

Generate a single, self-contained Markdown document that fully reconstructs the active working context of this project so a new agent with an empty memory can continue without loss of continuity.

Save to: ${project?.udoPath || '~/.udo/projects/[current]'}/.project-catalog/sessions/[timestamp]-handoff.md

**Start with Tags:**
Tags: #topic1 #topic2 #topic3

**Include:**
1. Executive Summary
2. User Context (goals, preferences, working style)
3. Active Work (todos, in progress, blocked)
4. Decisions Made (with rationale)
5. Technical Context (files changed, systems involved)
6. Rules of Engagement (how user wants AI to behave)
7. Known Risks & Failure Modes
8. Open Threads & Next Actions

**Precision Rules:**
- Use concrete language, not vague summaries
- Preserve terminology exactly as used
- If uncertain, label as "INFERRED"

Update PROJECT_STATE.json with current status.
Confirm when complete.`;
            
            await vscode.env.clipboard.writeText(prompt);
            sessionTracker.markHandoff();
            vscode.window.showInformationMessage('Full handoff prompt copied to clipboard. Paste it to your AI.');
        })
    );

    // Status
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.status', async () => {
            const prompt = `What's the current status? Give me an oversight report.`;
            
            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage('Status prompt copied to clipboard. Paste it to your AI.');
        })
    );

    // Add Lesson
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.addLesson', async () => {
            const lesson = await vscode.window.showInputBox({
                prompt: 'What lesson should the AI remember?',
                placeHolder: 'e.g., Never use iframes in this project'
            });

            if (!lesson) {
                return;
            }

            const priority = await vscode.window.showQuickPick(
                ['critical', 'high', 'normal', 'low'],
                { placeHolder: 'Select priority' }
            );

            if (!priority) {
                return;
            }

            const prompt = `Add this as a lesson learned:

Lesson: ${lesson}
Priority: ${priority}

Add it to LESSONS_LEARNED.md with the proper format. Confirm when done.`;

            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage('Add lesson prompt copied to clipboard. Paste it to your AI.');
        })
    );

    // Search Sessions
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.searchSessions', async () => {
            const tag = await vscode.window.showInputBox({
                prompt: 'Search sessions by tag',
                placeHolder: 'e.g., api, authentication, refactor'
            });

            if (!tag) {
                return;
            }

            const sessions = await sessionTracker.searchSessionsByTag(tag);
            
            if (sessions.length === 0) {
                vscode.window.showInformationMessage(`No sessions found with tag: ${tag}`);
                return;
            }

            const selected = await vscode.window.showQuickPick(sessions, {
                placeHolder: 'Select a session to open'
            });

            if (selected) {
                const project = projectManager.getCurrentProject();
                if (project) {
                    const filePath = path.join(project.udoPath, '.project-catalog', 'sessions', selected);
                    const doc = await vscode.workspace.openTextDocument(filePath);
                    await vscode.window.showTextDocument(doc);
                }
            }
        })
    );

    // Open UDO Folder
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.openFolder', async () => {
            const project = projectManager.getCurrentProject();
            if (!project) {
                vscode.window.showErrorMessage('No UDO project loaded');
                return;
            }

            const uri = vscode.Uri.file(project.udoPath);
            await vscode.commands.executeCommand('revealFileInOS', uri);
        })
    );

    // Open Rules
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.openRules', async () => {
            const project = projectManager.getCurrentProject();
            if (!project) {
                vscode.window.showErrorMessage('No UDO project loaded');
                return;
            }

            const rulesPath = path.join(project.udoPath, '.rules');
            const uri = vscode.Uri.file(rulesPath);
            await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
        })
    );

    // Open Hard Stops
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.openHardStops', async () => {
            const project = projectManager.getCurrentProject();
            if (!project) {
                vscode.window.showErrorMessage('No UDO project loaded');
                return;
            }

            const filePath = path.join(project.udoPath, 'HARD_STOPS.md');
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
        })
    );

    // Open Project State
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.openState', async () => {
            const project = projectManager.getCurrentProject();
            if (!project) {
                vscode.window.showErrorMessage('No UDO project loaded');
                return;
            }

            const filePath = path.join(project.udoPath, 'PROJECT_STATE.json');
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
        })
    );

    // Takeover Mode
    context.subscriptions.push(
        vscode.commands.registerCommand('udo.takeover', async () => {
            const project = projectManager.getCurrentProject();
            
            const prompt = `Read ${project?.udoPath || '~/.udo/projects/[current]'}/.takeover/TAKEOVER_ORCHESTRATOR.md and start takeover.

This will analyze the project and help me take it over systematically.`;
            
            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage('Takeover prompt copied to clipboard. Paste it to your AI.');
        })
    );
}
