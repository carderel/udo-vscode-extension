import * as vscode from 'vscode';
import { ProjectManager } from './core/projectManager';
import { ContextManager } from './core/contextManager';
import { SessionTracker } from './features/sessionTracker';
import { StatusBarManager } from './ui/statusBar';
import { SidebarProvider } from './ui/sidebarProvider';
import { registerCommands } from './commands';

let projectManager: ProjectManager;
let contextManager: ContextManager;
let sessionTracker: SessionTracker;
let statusBarManager: StatusBarManager;

export async function activate(context: vscode.ExtensionContext) {
    console.log('UDO Extension activating...');

    // Initialize core managers
    projectManager = new ProjectManager(context);
    contextManager = new ContextManager(projectManager);
    sessionTracker = new SessionTracker(projectManager);
    statusBarManager = new StatusBarManager();

    // Register sidebar
    const sidebarProvider = new SidebarProvider(context.extensionUri, projectManager);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('udo-status', sidebarProvider)
    );

    // Register all commands
    registerCommands(context, projectManager, contextManager, sessionTracker);

    // Initialize status bar
    if (vscode.workspace.getConfiguration('udo').get('showStatusBar')) {
        statusBarManager.initialize(context, sessionTracker);
    }

    // Check for existing project on startup
    await checkForProject();

    // Listen for workspace changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(async () => {
            await checkForProject();
        })
    );

    // Auto-handoff on window close
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(async () => {
            // This fires frequently, so we track in sessionTracker
            // Actual handoff prompt happens in deactivate or window state change
        })
    );

    // Periodic reminder
    startPeriodicReminder(context);

    console.log('UDO Extension activated');
}

async function checkForProject(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
    }

    const projectPath = workspaceFolders[0].uri.fsPath;
    const hasUdo = await projectManager.hasUdoLink(projectPath);

    if (hasUdo) {
        await projectManager.loadProject(projectPath);
        await contextManager.updateContextFile();
        sessionTracker.startSession();
        statusBarManager.update(projectManager.getCurrentProject());
    } else {
        // Prompt to initialize
        const hasUdoFiles = await projectManager.hasExistingUdoFiles(projectPath);
        if (hasUdoFiles) {
            promptMigration(projectPath);
        } else {
            promptInitialization(projectPath);
        }
    }
}

async function promptInitialization(projectPath: string): Promise<void> {
    const result = await vscode.window.showInformationMessage(
        'Initialize UDO for this project? This enables AI continuity across sessions.',
        'Initialize',
        'Not Now',
        "Don't Ask Again"
    );

    if (result === 'Initialize') {
        await vscode.commands.executeCommand('udo.initialize');
    }
}

async function promptMigration(projectPath: string): Promise<void> {
    const result = await vscode.window.showInformationMessage(
        'UDO files detected. Move them to extension storage for a cleaner project folder?',
        'Migrate',
        'Keep In Project',
        'Ignore'
    );

    if (result === 'Migrate') {
        await projectManager.migrateExistingProject(projectPath);
        await contextManager.updateContextFile();
    } else if (result === 'Keep In Project') {
        await projectManager.linkExistingProject(projectPath);
        await contextManager.updateContextFile();
    }
}

function startPeriodicReminder(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('udo');
    if (!config.get('reminderEnabled')) {
        return;
    }

    const intervalMinutes = config.get<number>('reminderIntervalMinutes') || 30;
    
    const interval = setInterval(() => {
        if (sessionTracker.isActive() && !sessionTracker.hasRecentHandoff()) {
            vscode.window.showInformationMessage(
                '💾 UDO: Consider saving a checkpoint',
                'Quick Handoff',
                'Dismiss'
            ).then(result => {
                if (result === 'Quick Handoff') {
                    vscode.commands.executeCommand('udo.quickHandoff');
                }
            });
        }
    }, intervalMinutes * 60 * 1000);

    context.subscriptions.push({
        dispose: () => clearInterval(interval)
    });
}

export async function deactivate(): Promise<void> {
    console.log('UDO Extension deactivating...');

    // Check if we should auto-save
    const config = vscode.workspace.getConfiguration('udo');
    
    if (sessionTracker?.isActive()) {
        if (config.get('autoHandoffOnClose') && !sessionTracker.hasRecentHandoff()) {
            // Try to create auto-save
            if (config.get('autoSaveOnClose')) {
                await sessionTracker.createAutoSave();
            }
        }
    }

    console.log('UDO Extension deactivated');
}
