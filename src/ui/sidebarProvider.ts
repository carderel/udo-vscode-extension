import * as vscode from 'vscode';
import { ProjectManager } from '../core/projectManager';

export class SidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _projectManager: ProjectManager;

    constructor(extensionUri: vscode.Uri, projectManager: ProjectManager) {
        this._extensionUri = extensionUri;
        this._projectManager = projectManager;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlContent();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'resume':
                    vscode.commands.executeCommand('udo.resume');
                    break;
                case 'handoff':
                    vscode.commands.executeCommand('udo.quickHandoff');
                    break;
                case 'status':
                    vscode.commands.executeCommand('udo.status');
                    break;
                case 'openFolder':
                    vscode.commands.executeCommand('udo.openFolder');
                    break;
                case 'openFile':
                    this.openFile(message.file);
                    break;
            }
        });
    }

    private async openFile(relativePath: string): Promise<void> {
        const project = this._projectManager.getCurrentProject();
        if (!project) {
            return;
        }
        const fullPath = vscode.Uri.file(`${project.udoPath}/${relativePath}`);
        await vscode.window.showTextDocument(fullPath);
    }

    public refresh(): void {
        if (this._view) {
            this._view.webview.html = this._getHtmlContent();
        }
    }

    private _getHtmlContent(): string {
        const project = this._projectManager.getCurrentProject();
        
        if (!project) {
            return this._getNoProjectHtml();
        }

        const state = project.state;
        const todoCount = state.todos?.length || 0;
        const inProgressCount = state.in_progress?.length || 0;
        const blockerCount = state.blockers?.length || 0;
        const completedCount = state.completed?.length || 0;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UDO</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 10px;
            margin: 0;
        }
        .section {
            margin-bottom: 15px;
        }
        .section-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-textLink-foreground);
        }
        .status-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        .button-row {
            display: flex;
            gap: 5px;
            margin-bottom: 10px;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
            flex: 1;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .stat {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .stat-value {
            font-weight: bold;
        }
        .link {
            color: var(--vscode-textLink-foreground);
            cursor: pointer;
            text-decoration: none;
        }
        .link:hover {
            text-decoration: underline;
        }
        .quick-access {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .quick-access li {
            padding: 4px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
        }
        .status-active {
            background: var(--vscode-testing-iconPassed);
            color: white;
        }
    </style>
</head>
<body>
    <div class="section">
        <div class="section-title">📊 ${project.name}</div>
        <div class="status-row">
            <span>Status</span>
            <span class="status-badge status-active">Active</span>
        </div>
        <div class="status-row">
            <span>Phase</span>
            <span>${state.phase || 'Unknown'}</span>
        </div>
    </div>

    <div class="button-row">
        <button onclick="send('resume')">Resume</button>
        <button onclick="send('handoff')">Handoff</button>
        <button onclick="send('status')">Status</button>
    </div>

    <div class="section">
        <div class="section-title">📋 Current State</div>
        <div class="stat">
            <span>Todos</span>
            <span class="stat-value">${todoCount}</span>
        </div>
        <div class="stat">
            <span>In Progress</span>
            <span class="stat-value">${inProgressCount}</span>
        </div>
        <div class="stat">
            <span>Blocked</span>
            <span class="stat-value">${blockerCount}</span>
        </div>
        <div class="stat">
            <span>Completed</span>
            <span class="stat-value">${completedCount}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">📁 Quick Access</div>
        <ul class="quick-access">
            <li><span class="link" onclick="openFile('HARD_STOPS.md')">📄 Hard Stops</span></li>
            <li><span class="link" onclick="openFile('LESSONS_LEARNED.md')">📄 Lessons</span></li>
            <li><span class="link" onclick="openFile('PROJECT_STATE.json')">📄 Project State</span></li>
            <li><span class="link" onclick="openFile('.rules')">📂 Rules</span></li>
            <li><span class="link" onclick="send('openFolder')">📂 Open UDO Folder</span></li>
        </ul>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function send(command) {
            vscode.postMessage({ command });
        }
        
        function openFile(file) {
            vscode.postMessage({ command: 'openFile', file });
        }
    </script>
</body>
</html>`;
    }

    private _getNoProjectHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UDO</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 20px;
            text-align: center;
        }
        .title {
            font-size: 18px;
            margin-bottom: 15px;
        }
        .description {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 20px;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="title">📘 UDO</div>
    <div class="description">
        Universal Dynamic Orchestrator<br><br>
        No project initialized.<br>
        Initialize UDO to enable AI memory and continuity.
    </div>
    <button onclick="initialize()">Initialize Project</button>

    <script>
        const vscode = acquireVsCodeApi();
        
        function initialize() {
            vscode.postMessage({ command: 'initialize' });
        }
    </script>
</body>
</html>`;
    }
}
