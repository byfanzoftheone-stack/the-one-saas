export type Job = {
  id: string;
  module: string;
  title: string;
  address: string;
  notes: string;
  status: "open" | "in_progress" | "done";
  createdAt: string;
};

export type Person = {
  id: string;
  module: string;
  name: string;
  role: string;
};

export type Task = {
  id: string;
  module: string;
  text: string;
  done: boolean;
};

export type Workspace = {
  owner: string;
  installed: string[];
  jobs: Job[];
  crew: Person[];
  tasks: Task[];
  updatedAt: string;
};

const KEY = "the-one-saas.workspace.v1";

export function emptyWorkspace(): Workspace {
  return {
    owner: "",
    installed: [],
    jobs: [],
    crew: [],
    tasks: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadWorkspace(): Workspace {
  if (typeof window === "undefined") return emptyWorkspace();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyWorkspace();
    const parsed = JSON.parse(raw) as Workspace;
    return {
      ...emptyWorkspace(),
      ...parsed,
      installed: parsed.installed || [],
      jobs: parsed.jobs || [],
      crew: parsed.crew || [],
      tasks: parsed.tasks || [],
    };
  } catch {
    return emptyWorkspace();
  }
}

export function saveWorkspace(ws: Workspace): Workspace {
  const next = { ...ws, updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isJobModule(vertical: string) {
  return ["construction", "roofing", "snow-ice", "pool-service", "str", "logistics"].includes(vertical);
}

export function isCrewModule(vertical: string) {
  return vertical === "core";
}
