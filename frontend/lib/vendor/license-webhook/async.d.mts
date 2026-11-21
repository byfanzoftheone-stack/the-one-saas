// Local typing only (see ../PROVENANCE.md).
import type { AsyncLicenseStore } from './stores.mjs';
export { MemoryStore, JsonFileStore, SqliteStore, PostgresStore, POSTGRES_SCHEMA, storeFromEnv } from './stores.mjs';
export interface AsyncLicenseWebhook {
  handle(rawBody: Buffer | string, signatureHeader: string | null | undefined): Promise<{ status: number; body: Record<string, unknown> }>;
  validate(key: unknown): Promise<{ valid: boolean; tier?: string }>;
  pendingDeliveries(): Promise<{ hash: string; tier: string; email: string | null; key: string }[]>;
  markDelivered(hash: string, approver: string): Promise<boolean>;
}
export function createAsyncLicenseWebhook(opts: { secret: string | undefined; priceTiers?: Record<string, string>; store: AsyncLicenseStore; audit?: (r: Record<string, unknown>) => void | Promise<void>; now?: () => number }): AsyncLicenseWebhook;
export function migrateFromLegacyJson(file: string, store: AsyncLicenseStore): Promise<{ licenses: number; outbox: number; events: number }>;
