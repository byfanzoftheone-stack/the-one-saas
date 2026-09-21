import catalog from "@/data/modules.json";

export type ModuleItem = {
  name: string;
  price: number;
  vertical: string;
  installed: boolean;
  blurb: string;
};

const g = globalThis as any;

function seed(): Map<string, ModuleItem> {
  const map = new Map<string, ModuleItem>();
  for (const m of catalog.modules as ModuleItem[]) {
    map.set(m.name, { ...m, installed: Boolean(m.installed) });
  }
  return map;
}

if (!g.__oneModules) g.__oneModules = seed();

export function getModules(): ModuleItem[] {
  const map: Map<string, ModuleItem> = g.__oneModules;
  // Re-seed any catalog entries missing from runtime map (after cold start / HMR)
  for (const m of catalog.modules as ModuleItem[]) {
    if (!map.has(m.name)) map.set(m.name, { ...m, installed: Boolean(m.installed) });
  }
  return Array.from(map.values());
}

export function setInstalled(name: string, installed: boolean): ModuleItem | null {
  const map: Map<string, ModuleItem> = g.__oneModules;
  const existing = map.get(name);
  if (!existing) {
    const fromCatalog = (catalog.modules as ModuleItem[]).find((m) => m.name === name);
    if (!fromCatalog) return null;
    const next = { ...fromCatalog, installed };
    map.set(name, next);
    return next;
  }
  const next = { ...existing, installed };
  map.set(name, next);
  return next;
}
