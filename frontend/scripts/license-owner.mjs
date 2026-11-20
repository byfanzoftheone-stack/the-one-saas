#!/usr/bin/env node
// Owner CLI. Lists keys awaiting delivery and records that YOU delivered one. It NEVER sends email or calls Stripe.
//   node scripts/license-owner.mjs pending                 (masked; add --reveal to print plaintext keys)
//   node scripts/license-owner.mjs delivered <hash> --approver "Your Name"
// Uses LICENSE_DB (same file as the server). Plaintext keys are secrets: do not paste output into chat or logs.
import { buildLicenseWebhook, licenseDbPath } from '../lib/license.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const lw = buildLicenseWebhook({ audit: (r) => console.error(JSON.stringify({ audit: r })) });
const flag = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };

if (cmd === 'pending') {
  const reveal = rest.includes('--reveal');
  const rows = lw.pendingDeliveries().map((p) => ({ hash: p.hash, tier: p.tier, email: p.email, key: reveal ? p.key : p.key.slice(0, 8) + '…(use --reveal)' }));
  console.error(`db: ${licenseDbPath()}`);
  console.log(JSON.stringify(rows, null, 2));
} else if (cmd === 'delivered') {
  const hash = rest[0]; const approver = flag('--approver');
  if (!hash || hash.startsWith('--') || !approver) { console.error('usage: delivered <hash> --approver "<name>"'); process.exit(2); }
  try { lw.markDelivered(hash, approver); console.log(`marked delivered by ${approver}`); }
  catch (e) { console.error(e.message); process.exit(1); }
} else {
  console.error('usage: license-owner.mjs pending [--reveal] | delivered <hash> --approver "<name>"');
  process.exit(2);
}
