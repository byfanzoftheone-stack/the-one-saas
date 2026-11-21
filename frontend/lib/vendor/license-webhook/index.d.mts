// Local typing only (see ../PROVENANCE.md).
export interface LicenseStore { read(): any; write(data: any): void }
export class JsonStore implements LicenseStore { constructor(file: string); file: string; read(): any; write(data: any): void }
export function verifyStripeSignature(rawBody: string | Buffer, header: string | null | undefined, secret: string | undefined, opts?: { now?: number; tolerance?: number }): { ok: boolean; reason?: string };
export function hashKey(key: string): string;
export function generateKey(tier: string): string;
