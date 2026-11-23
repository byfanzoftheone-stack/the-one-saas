#!/usr/bin/env node
// Owner CLI. Lists keys awaiting delivery and records that YOU delivered one. It NEVER sends email or calls Stripe.
//   node scripts/license-owner.mjs pending                 (masked; add --reveal to print plaintext keys)
//   node scripts/license-owner.mjs delivered <hash> --approver "Your Name"
//   node scripts/license-owner.mjs migrate-json <file>     (import a legacy licenses.json into the configured store; idempotent)
// Uses the same env as the server: LICENSE_DATABASE_URL (Postgres) or LICENSE_DB (sqlite path / .json). Fails closed if unset.
// Plaintext keys are secrets: do not paste output into chat or logs.
import fs from 'node:fs';
import { buildLicenseWebhook, licenseStoreFromEnv, describeStore, closeStore } from '../lib/license.mjs';
import { migrateFromLegacyJson } from '../lib/vendor/license-webhook/async.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const flag = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };
const usage = () => { console.error('usage: license-owner.mjs pending [--reveal] | delivered <hash> --approver "<name>" | migrate-json <file>'); process.exit(2); };
if (!['pending', 'delivered', 'migrate-json'].includes(cmd)) usage();

let store;
try { store = await licenseStoreFromEnv(); } catch (e) { console.error(e.message); process.exit(1); }
let code = 0;
try {
  const lw = buildLicenseWebhook({ store, audit: (r) => console.error(JSON.stringify({ audit: r })) });
  if (cmd === 'pending') {
    const reveal = rest.includes('--reveal');
    const rows = (await lw.pendingDeliveries()).map((p) => ({ hash: p.hash, tier: p.tier, email: p.email, key: reveal ? p.key : p.key.slice(0, 8) + '…(use --reveal)' }));
    console.error(`store: ${describeStore()}`);
    console.log(JSON.stringify(rows, null, 2));
  } else if (cmd === 'delivered') {
    const hash = rest[0]; const approver = flag('--approver');
    if (!hash || hash.startsWith('--') || !approver) { console.error('usage: delivered <hash> --approver "<name>"'); code = 2; }
    else { await lw.markDelivered(hash, approver); console.log(`marked delivered by ${approver}`); }
  } else {
    const file = rest[0];
    if (!file || file.startsWith('--')) { console.error('usage: migrate-json <file>'); code = 2; }
    else if (!fs.existsSync(file)) { console.error(`file not found: ${file}`); code = 1; }
    else {
      const c = await migrateFromLegacyJson(file, store);
      console.error(`store: ${describeStore()}`);
      console.log(JSON.stringify({ migrated: c }));
    }
  }
} catch (e) { console.error(e.message); code = 1; }
await closeStore(store);
process.exit(code);
