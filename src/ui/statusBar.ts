import * as vscode from 'vscode';
import { UdoProject } from '../core/types';
import { SessionTracker } from '../features/sessionTracker';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem | null = null;
    private sessionTracker: SessionTracker | null = null;
    private updateInterval: NodeJS.Timeout | null = null;

    public initialize(context: vscode.ExtensionContext, sessionTracker: SessionTracker): void {
        this.sessionTracker = sessionTracker;

        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'udo.status';
        context.subscriptions.push(this.statusBarItem);

        // Update every minute
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 60000);

        context.subscriptions.push({
            dispose: () => {
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                }
            }
        });

        this.statusBarItem.show();
    }

    public update(project: UdoProject | null): void {
        this.updateDisplay(project);
    }

    private updateDisplay(project?: UdoProject | null): void {
        if (!this.statusBarItem) {
            return;
        }

        if (!project && !this.sessionTracker?.isActive()) {
            this.statusBarItem.text = '$(book) UDO: Not initialized';
            this.statusBarItem.tooltip = 'Click to initialize UDO for this project';
            this.statusBarItem.command = 'udo.initialize';
            return;
        }

        const duration = this.sessionTracker?.getSessionDurationFormatted() || '0m';
        const hasHandoff = this.sessionTracker?.hasRecentHandoff() || false;
        const saveStatus = hasHandoff ? '💾 Saved' : '⚠️ Unsaved';

        this.statusBarItem.text = `$(book) UDO | ⏱️ ${duration} | ${saveStatus}`;
        this.statusBarItem.tooltip = this.generateTooltip(project, duration, hasHandoff);
        this.statusBarItem.command = 'udo.status';
    }

    private generateTooltip(project: UdoProject | null | undefined, duration: string, hasHandoff: boolean): string {
        const lines = [
            'UDO - Universal Dynamic Orchestrator',
            '',
            `Project: ${project?.name || 'Unknown'}`,
            `Session: ${duration}`,
            `Status: ${hasHandoff ? 'Saved' : 'Not saved - consider running handoff'}`,
            '',
            'Click for status report'
        ];
        return lines.join('\n');
    }

    public showWarning(): void {
        if (this.statusBarItem) {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    }

    public clearWarning(): void {
        if (this.statusBarItem) {
            this.statusBarItem.backgroundColor = undefined;
        }
    }

    public dispose(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
        }
    }
}
