// Local typing only (see ../PROVENANCE.md).
export interface LicenseTx {
  claimEvent(id: string, type: string, at: string): Promise<boolean>;
  putLicense(hash: string, lic: any): Promise<void>;
  getLicense(hash: string): Promise<any | null>;
  revokeMatching(o: { subscription: string | null; customer: string | null; reason: string; at: string }): Promise<number>;
  putOutbox(hash: string, entry: any): Promise<void>;
  listPending(): Promise<{ hash: string; tier: string; email: string | null; key: string }[]>;
  markDelivered(hash: string, approver: string, at: string): Promise<void>;
}
export interface AsyncLicenseStore { transaction<T>(fn: (tx: LicenseTx) => Promise<T>): Promise<T>; close?(): void; pool?: { end(): Promise<void> } }
export class MemoryStore implements AsyncLicenseStore { transaction<T>(fn: (tx: LicenseTx) => Promise<T>): Promise<T> }
export class JsonFileStore implements AsyncLicenseStore { constructor(file: string); transaction<T>(fn: (tx: LicenseTx) => Promise<T>): Promise<T> }
export class SqliteStore implements AsyncLicenseStore { constructor(file?: string); transaction<T>(fn: (tx: LicenseTx) => Promise<T>): Promise<T>; close(): void }
export class PostgresStore implements AsyncLicenseStore { constructor(pool: any); pool: { end(): Promise<void> }; ensureSchema(): Promise<void>; transaction<T>(fn: (tx: LicenseTx) => Promise<T>): Promise<T> }
export const POSTGRES_SCHEMA: string;
export function storeFromEnv(env?: Record<string, string | undefined>): Promise<AsyncLicenseStore>;
