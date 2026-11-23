// Wiring for the vendored license-webhook (async, transactional stores). Plain .mjs so node:test and the CLI can import it.
// FAIL CLOSED: if no store is configured the webhook answers 503 and validate() denies. There is no temp-dir default.
import { createAsyncLicenseWebhook, storeFromEnv } from './vendor/license-webhook/async.mjs';

/** Price id -> tier, from env only. Null-prototype so a hostile id like "constructor" can never resolve. */
export function priceTiersFromEnv(env = process.env) {
  const map = Object.create(null);
  for (const tier of ['starter', 'growth', 'premium']) {
    const id = (env[`STRIPE_PRICE_${tier.toUpperCase()}`] || '').trim();
    if (id) map[id] = tier;
  }
  return map;
}

/** Store from env. On Vercel (ephemeral disk) only Postgres (LICENSE_DATABASE_URL) is accepted. Throws when unconfigured. */
export async function licenseStoreFromEnv(env = process.env) {
  if (env.VERCEL && !env.LICENSE_DATABASE_URL) {
    throw new Error('license store not configured: on Vercel set LICENSE_DATABASE_URL (Postgres); file/SQLite storage is ephemeral there');
  }
  return storeFromEnv(env);
}

/** Short, secret-free description of the configured store (for the CLI). */
export function describeStore(env = process.env) {
  if (env.LICENSE_DATABASE_URL) return 'postgres (LICENSE_DATABASE_URL)';
  if (env.LICENSE_DB) return `${env.LICENSE_DB.endsWith('.json') ? 'json file' : 'sqlite'} ${env.LICENSE_DB}`;
  return 'NOT CONFIGURED';
}

export async function closeStore(store) {
  try { if (store?.pool?.end) await store.pool.end(); else store?.close?.(); } catch { /* ignore */ }
}

export function buildLicenseWebhook({ env = process.env, audit = () => {}, store, now } = {}) {
  if (!store) throw new Error('store required');
  return createAsyncLicenseWebhook({
    secret: env.STRIPE_WEBHOOK_SECRET,
    priceTiers: priceTiersFromEnv(env),
    store,
    audit,
    ...(now ? { now } : {}),
  });
}

// Cached store promise (one pool per server instance). A failed init is not cached, so a fixed config recovers.
export function getStore(env = process.env) {
  const g = globalThis;
  if (!g.__licenseStore) {
    g.__licenseStore = licenseStoreFromEnv(env).catch((e) => { g.__licenseStore = undefined; throw e; });
  }
  return g.__licenseStore;
}

/** Async; REJECTS when the store is not configured/reachable. Callers must treat that as 503 / deny. */
export async function getLicenseWebhook(audit) {
  return buildLicenseWebhook({ audit, store: await getStore() });
}

/** Gate for a paid route: await validateLicense(req.headers.get('x-license-key')) -> { valid, tier? }. Denies on ANY failure. */
export async function validateLicense(key, audit) {
  try { return await (await getLicenseWebhook(audit)).validate(key); }
  catch { return { valid: false }; }
}
