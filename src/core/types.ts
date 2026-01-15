export interface UdoProject {
    projectPath: string;
    udoPath: string;
    name: string;
    state: ProjectState;
    sessionStart: Date;
}

export interface ProjectState {
    goal: string;
    phase: string;
    todos: Todo[];
    in_progress: Todo[];
    completed: Todo[];
    blockers: Blocker[];
    agent_registry?: Agent[];
    checkpoints?: Checkpoint[];
    circuit_breaker?: CircuitBreaker;
    context_health?: ContextHealth;
    current_session?: CurrentSession;
    notes?: string;
}

export interface Todo {
    id: string;
    title: string;
    description?: string;
    priority?: 'critical' | 'high' | 'normal' | 'low';
    assignedTo?: string;
    createdAt?: string;
}

export interface Blocker {
    id: string;
    description: string;
    blockedTodos: string[];
    createdAt?: string;
}

export interface Agent {
    name: string;
    status: 'active' | 'idle' | 'archived';
    specialization: string;
}

export interface Checkpoint {
    name: string;
    timestamp: string;
    description?: string;
}

export interface CircuitBreaker {
    triggered: boolean;
    reason: string | null;
    timestamp: string | null;
}

export interface ContextHealth {
    estimated_usage: 'low' | 'medium' | 'high';
    last_archive: string | null;
}

export interface CurrentSession {
    started: string;
    llm: string;
    actions: string[];
}

export interface UdoIndex {
    version: string;
    projects: { [projectPath: string]: IndexEntry };
}

export interface IndexEntry {
    udoId: string;
    name: string;
    created: string;
    lastAccess: string;
}

export interface Session {
    filename: string;
    date: Date;
    tags: string[];
    summary?: string;
    llm?: string;
}

export interface Lesson {
    id: string;
    title: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    date: string;
    scope: string;
    context: string;
    rule: string;
}
