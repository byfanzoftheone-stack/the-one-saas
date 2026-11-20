// Types for the vendored license-webhook module (see PROVENANCE.md next to it).
export interface LicenseStore { read(): any; write(data: any): void }
export class JsonStore implements LicenseStore {
  constructor(file: string);
  file: string;
  read(): any;
  write(data: any): void;
}
export function verifyStripeSignature(rawBody: string | Buffer, header: string | null | undefined, secret: string | undefined, opts?: { now?: number; tolerance?: number }): { ok: boolean; reason?: string };
export function hashKey(key: string): string;
export function generateKey(tier: string): string;
export interface LicenseWebhook {
  handle(rawBody: Buffer | string, signatureHeader: string | null | undefined): { status: number; body: Record<string, unknown> };
  validate(key: unknown): { valid: boolean; tier?: string };
  pendingDeliveries(): { hash: string; tier: string; email: string | null; key: string }[];
  markDelivered(hash: string, approver: string): boolean;
}
export function createLicenseWebhook(opts: {
  secret: string | undefined;
  priceTiers?: Record<string, string>;
  store: LicenseStore;
  audit?: (record: Record<string, unknown>) => void;
  now?: () => number;
}): LicenseWebhook;
