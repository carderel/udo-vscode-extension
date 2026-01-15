import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { UdoProject, UdoIndex, ProjectState } from './types';
import { getTemplates } from '../templates';

export class ProjectManager {
    private context: vscode.ExtensionContext;
    private currentProject: UdoProject | null = null;
    private globalPath: string;
    private index: UdoIndex;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.globalPath = this.resolveGlobalPath();
        this.index = this.loadIndex();
        this.ensureGlobalDirectory();
    }

    private resolveGlobalPath(): string {
        const configPath = vscode.workspace.getConfiguration('udo').get<string>('globalPath') || '~/.udo';
        return configPath.replace('~', os.homedir());
    }

    private ensureGlobalDirectory(): void {
        const projectsPath = path.join(this.globalPath, 'projects');
        if (!fs.existsSync(projectsPath)) {
            fs.mkdirSync(projectsPath, { recursive: true });
        }
    }

    private loadIndex(): UdoIndex {
        const indexPath = path.join(this.globalPath, 'index.json');
        if (fs.existsSync(indexPath)) {
            try {
                return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
            } catch {
                return { version: '1.0', projects: {} };
            }
        }
        return { version: '1.0', projects: {} };
    }

    private saveIndex(): void {
        const indexPath = path.join(this.globalPath, 'index.json');
        fs.writeFileSync(indexPath, JSON.stringify(this.index, null, 2));
    }

    public async hasUdoLink(projectPath: string): Promise<boolean> {
        const linkPath = path.join(projectPath, '.udo-link');
        return fs.existsSync(linkPath);
    }

    public async hasExistingUdoFiles(projectPath: string): Promise<boolean> {
        const orchestratorPath = path.join(projectPath, 'ORCHESTRATOR.md');
        const catalogPath = path.join(projectPath, '.project-catalog');
        return fs.existsSync(orchestratorPath) || fs.existsSync(catalogPath);
    }

    public async initializeProject(projectPath: string): Promise<UdoProject> {
        const projectName = path.basename(projectPath);
        const udoId = `${projectName}-${Date.now().toString(36)}`;
        const udoPath = path.join(this.globalPath, 'projects', udoId);

        // Create UDO directory structure
        await this.createUdoStructure(udoPath);

        // Create link file in project
        const linkPath = path.join(projectPath, '.udo-link');
        const linkContent = {
            udoPath: udoPath,
            created: new Date().toISOString()
        };
        fs.writeFileSync(linkPath, JSON.stringify(linkContent, null, 2));

        // Add to .gitignore if exists
        await this.addToGitignore(projectPath);

        // Update index
        this.index.projects[projectPath] = {
            udoId,
            name: projectName,
            created: new Date().toISOString(),
            lastAccess: new Date().toISOString()
        };
        this.saveIndex();

        // Load and return project
        return this.loadProject(projectPath);
    }

    private async createUdoStructure(udoPath: string): Promise<void> {
        // Create directories
        const dirs = [
            '',
            '.agents/_archive',
            '.checkpoints',
            '.inputs',
            '.memory/canonical',
            '.memory/disposable',
            '.memory/working',
            '.outputs/_drafts',
            '.project-catalog/agents',
            '.project-catalog/archive',
            '.project-catalog/decisions',
            '.project-catalog/errors',
            '.project-catalog/handoffs',
            '.project-catalog/sessions',
            '.rules',
            '.takeover/audits',
            '.takeover/evidence',
            '.takeover/agent-templates',
            '.templates'
        ];

        for (const dir of dirs) {
            const fullPath = path.join(udoPath, dir);
            fs.mkdirSync(fullPath, { recursive: true });
        }

        // Write template files
        const templates = getTemplates();
        for (const [relativePath, content] of Object.entries(templates)) {
            const fullPath = path.join(udoPath, relativePath);
            const dirPath = path.dirname(fullPath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(fullPath, content);
        }
    }

    private async addToGitignore(projectPath: string): Promise<void> {
        const gitignorePath = path.join(projectPath, '.gitignore');
        const entry = '\n# UDO link file\n.udo-link\n';

        if (fs.existsSync(gitignorePath)) {
            const content = fs.readFileSync(gitignorePath, 'utf8');
            if (!content.includes('.udo-link')) {
                fs.appendFileSync(gitignorePath, entry);
            }
        } else {
            fs.writeFileSync(gitignorePath, entry.trim() + '\n');
        }
    }

    public async loadProject(projectPath: string): Promise<UdoProject> {
        const linkPath = path.join(projectPath, '.udo-link');
        const linkContent = JSON.parse(fs.readFileSync(linkPath, 'utf8'));
        const udoPath = linkContent.udoPath;

        // Update last access
        if (this.index.projects[projectPath]) {
            this.index.projects[projectPath].lastAccess = new Date().toISOString();
            this.saveIndex();
        }

        // Load project state
        const statePath = path.join(udoPath, 'PROJECT_STATE.json');
        let state: ProjectState = {
            goal: '',
            phase: 'initialized',
            todos: [],
            in_progress: [],
            completed: [],
            blockers: []
        };
        
        if (fs.existsSync(statePath)) {
            try {
                state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
            } catch {
                // Use default state
            }
        }

        this.currentProject = {
            projectPath,
            udoPath,
            name: path.basename(projectPath),
            state,
            sessionStart: new Date()
        };

        return this.currentProject;
    }

    public async migrateExistingProject(projectPath: string): Promise<UdoProject> {
        const projectName = path.basename(projectPath);
        const udoId = `${projectName}-${Date.now().toString(36)}`;
        const udoPath = path.join(this.globalPath, 'projects', udoId);

        // Create UDO directory
        fs.mkdirSync(udoPath, { recursive: true });

        // Move existing files
        const filesToMove = [
            'START_HERE.md',
            'ORCHESTRATOR.md',
            'COMMANDS.md',
            'HANDOFF_PROMPT.md',
            'HARD_STOPS.md',
            'LESSONS_LEARNED.md',
            'NON_GOALS.md',
            'OVERSIGHT_DASHBOARD.md',
            'PROJECT_STATE.json',
            'PROJECT_META.json',
            'CAPABILITIES.json'
        ];

        const dirsToMove = [
            '.agents',
            '.checkpoints',
            '.inputs',
            '.memory',
            '.outputs',
            '.project-catalog',
            '.rules',
            '.takeover',
            '.templates'
        ];

        for (const file of filesToMove) {
            const src = path.join(projectPath, file);
            const dest = path.join(udoPath, file);
            if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
            }
        }

        for (const dir of dirsToMove) {
            const src = path.join(projectPath, dir);
            const dest = path.join(udoPath, dir);
            if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
            }
        }

        // Create link file
        const linkPath = path.join(projectPath, '.udo-link');
        const linkContent = {
            udoPath: udoPath,
            created: new Date().toISOString(),
            migratedFrom: 'in-project'
        };
        fs.writeFileSync(linkPath, JSON.stringify(linkContent, null, 2));

        // Add to gitignore
        await this.addToGitignore(projectPath);

        // Update index
        this.index.projects[projectPath] = {
            udoId,
            name: projectName,
            created: new Date().toISOString(),
            lastAccess: new Date().toISOString()
        };
        this.saveIndex();

        return this.loadProject(projectPath);
    }

    public async linkExistingProject(projectPath: string): Promise<UdoProject> {
        // Link to in-project UDO files (don't move them)
        const linkPath = path.join(projectPath, '.udo-link');
        const linkContent = {
            udoPath: projectPath, // Points to project itself
            created: new Date().toISOString(),
            inProject: true
        };
        fs.writeFileSync(linkPath, JSON.stringify(linkContent, null, 2));

        // Update index
        const projectName = path.basename(projectPath);
        this.index.projects[projectPath] = {
            udoId: `${projectName}-inproject`,
            name: projectName,
            created: new Date().toISOString(),
            lastAccess: new Date().toISOString()
        };
        this.saveIndex();

        return this.loadProject(projectPath);
    }

    public getCurrentProject(): UdoProject | null {
        return this.currentProject;
    }

    public getUdoPath(): string | null {
        return this.currentProject?.udoPath || null;
    }

    public async saveProjectState(state: ProjectState): Promise<void> {
        if (!this.currentProject) {
            return;
        }
        const statePath = path.join(this.currentProject.udoPath, 'PROJECT_STATE.json');
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
        this.currentProject.state = state;
    }

    public async getSessionsPath(): Promise<string | null> {
        if (!this.currentProject) {
            return null;
        }
        return path.join(this.currentProject.udoPath, '.project-catalog', 'sessions');
    }

    public async getLessons(): Promise<string> {
        if (!this.currentProject) {
            return '';
        }
        const lessonsPath = path.join(this.currentProject.udoPath, 'LESSONS_LEARNED.md');
        if (fs.existsSync(lessonsPath)) {
            return fs.readFileSync(lessonsPath, 'utf8');
        }
        return '';
    }

    public async getHardStops(): Promise<string> {
        if (!this.currentProject) {
            return '';
        }
        const hardStopsPath = path.join(this.currentProject.udoPath, 'HARD_STOPS.md');
        if (fs.existsSync(hardStopsPath)) {
            return fs.readFileSync(hardStopsPath, 'utf8');
        }
        return '';
    }
}
