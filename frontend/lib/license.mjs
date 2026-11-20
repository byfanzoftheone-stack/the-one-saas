// Wiring for the vendored license-webhook. Plain .mjs so node:test and the CLI can import it without a TS build.
// STORAGE IS EPHEMERAL unless LICENSE_DB points at persistent disk (see MONETIZATION.md).
import os from 'node:os';
import path from 'node:path';
import { createLicenseWebhook, JsonStore } from './vendor/license-webhook.mjs';

/** Price id -> tier, from env only. Null-prototype so a hostile id like "constructor" can never resolve. */
export function priceTiersFromEnv(env = process.env) {
  const map = Object.create(null);
  for (const tier of ['starter', 'growth', 'premium']) {
    const id = (env[`STRIPE_PRICE_${tier.toUpperCase()}`] || '').trim();
    if (id) map[id] = tier;
  }
  return map;
}

export function licenseDbPath(env = process.env) {
  return env.LICENSE_DB || path.join(os.tmpdir(), 'the-one-saas-licenses.json');
}

export function buildLicenseWebhook({ env = process.env, audit = () => {}, store, now } = {}) {
  return createLicenseWebhook({
    secret: env.STRIPE_WEBHOOK_SECRET,
    priceTiers: priceTiersFromEnv(env),
    store: store || new JsonStore(licenseDbPath(env)),
    audit,
    ...(now ? { now } : {}),
  });
}

/** Lazily-built singleton for the Next server. */
export function getLicenseWebhook(audit) {
  const g = globalThis;
  if (!g.__licenseWebhook) g.__licenseWebhook = buildLicenseWebhook({ audit });
  return g.__licenseWebhook;
}

/** Helper for gating a paid route: validateLicense(req.headers.get('x-license-key')) -> { valid, tier? } */
export function validateLicense(key, audit) {
  return getLicenseWebhook(audit).validate(key);
}
