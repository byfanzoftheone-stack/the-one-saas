import type { LicenseWebhook, LicenseStore } from './vendor/license-webhook.mjs';
export function priceTiersFromEnv(env?: Record<string, string | undefined>): Record<string, string>;
export function licenseDbPath(env?: Record<string, string | undefined>): string;
export function buildLicenseWebhook(opts?: { env?: Record<string, string | undefined>; audit?: (r: Record<string, unknown>) => void; store?: LicenseStore; now?: () => number }): LicenseWebhook;
export function getLicenseWebhook(audit?: (r: Record<string, unknown>) => void): LicenseWebhook;
export function validateLicense(key: unknown, audit?: (r: Record<string, unknown>) => void): { valid: boolean; tier?: string };
