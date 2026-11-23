import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildLicenseWebhook, priceTiersFromEnv, validateLicense, licenseStoreFromEnv } from '../lib/license.mjs';
import { DatabaseSync } from 'node:sqlite';
import { SqliteStore } from '../lib/vendor/license-webhook/async.mjs';

const SECRET = 'whsec_test_local';
const env = { STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_STARTER: 'price_s', STRIPE_PRICE_GROWTH: 'price_g' };
const sign = (body, t = Math.floor(Date.now() / 1000), secret = SECRET) =>
  `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;
const ev = (id, price, paid = 'paid') => JSON.stringify({ id, type: 'checkout.session.completed',
  data: { object: { id: 'cs_1', customer: 'cus_1', subscription: 'sub_1', payment_status: paid,
    metadata: { price_id: price }, customer_details: { email: 'buyer@example.com' } } } });
function setup() {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lic-')), 'db.sqlite');
  const audits = [];
  const store = new SqliteStore(file);
  const lw = buildLicenseWebhook({ env, audit: (r) => audits.push(r), store });
  return { lw, file, audits, store };
}

test('price->tier map from env, ignores empties and proto keys', () => {
  const m = priceTiersFromEnv(env);
  assert.equal(m.price_s, 'starter'); assert.equal(m.price_g, 'growth');
  assert.equal(m.constructor, undefined);
});

test('rejects bad / missing / stale signature, accepts good', async () => {
  const { lw } = setup(); const b = ev('evt_1', 'price_s');
  assert.equal((await lw.handle(Buffer.from(b), sign(b, undefined, 'wrong'))).status, 400);
  assert.equal((await lw.handle(Buffer.from(b), undefined)).status, 400);
  assert.equal((await lw.handle(Buffer.from(b), sign(b, 1000))).status, 400);
  assert.equal((await lw.handle(Buffer.from(b + ' '), sign(b))).status, 400); // body altered after signing
  assert.equal((await lw.handle(Buffer.from(b), sign(b))).status, 200);
});

test('paid checkout issues key: hash stored, plaintext only in outbox, validate works', async () => {
  const { lw, file, audits } = setup(); const b = ev('evt_2', 'price_g');
  const out = await lw.handle(Buffer.from(b), sign(b));
  assert.equal(out.body.handled, true);
  const [p] = await lw.pendingDeliveries();
  assert.equal(p.tier, 'growth'); assert.match(p.key, /^FZ-GROWTH-/);
  assert.deepEqual(await lw.validate(p.key), { valid: true, tier: 'growth' });
  assert.equal((await lw.validate('FZ-GROWTH-nope')).valid, false);
  const raw = new DatabaseSync(file);
  assert.ok(!JSON.stringify(raw.prepare('SELECT * FROM licenses').all()).includes(p.key));
  assert.ok(!JSON.stringify(audits).includes(p.key));
  await lw.markDelivered(p.hash, 'owner');
  assert.equal((await lw.pendingDeliveries()).length, 0);
  assert.ok(!JSON.stringify(raw.prepare('SELECT * FROM license_outbox').all()).includes(p.key));
  raw.close();
  await assert.rejects(() => lw.markDelivered(p.hash, ''));
});

test('replay of same event id issues nothing more', async () => {
  const { lw } = setup(); const b = ev('evt_3', 'price_s');
  await lw.handle(Buffer.from(b), sign(b));
  const r = await lw.handle(Buffer.from(b), sign(b));
  assert.equal(r.body.duplicate, true);
  assert.equal((await lw.pendingDeliveries()).length, 1);
});

test('unknown price and unpaid issue nothing; client tier cannot be chosen', async () => {
  const { lw } = setup();
  const a = ev('evt_4', 'price_unknown'); assert.equal((await lw.handle(Buffer.from(a), sign(a))).body.handled, false);
  const c = ev('evt_5', 'constructor'); assert.equal((await lw.handle(Buffer.from(c), sign(c))).body.handled, false);
  const u = ev('evt_6', 'price_s', 'unpaid'); assert.equal((await lw.handle(Buffer.from(u), sign(u))).body.handled, false);
  assert.equal((await lw.pendingDeliveries()).length, 0);
});

test('refund revokes', async () => {
  const { lw } = setup(); const b = ev('evt_7', 'price_s'); await lw.handle(Buffer.from(b), sign(b));
  const [p] = await lw.pendingDeliveries();
  const r = JSON.stringify({ id: 'evt_8', type: 'customer.subscription.deleted', data: { object: { id: 'sub_1', customer: 'cus_1' } } });
  await lw.handle(Buffer.from(r), sign(r));
  assert.equal((await lw.validate(p.key)).valid, false);
});

test('25 concurrent copies of one event -> exactly one key', async () => {
  const { lw } = setup(); const b = ev('evt_c', 'price_s'); const h = sign(b);
  const rs = await Promise.all(Array.from({ length: 25 }, () => lw.handle(Buffer.from(b), h)));
  assert.ok(rs.every((r) => r.status === 200));
  assert.equal(rs.filter((r) => !r.body.duplicate).length, 1);
  assert.equal((await lw.pendingDeliveries()).length, 1);
});

test('gate denies and store init fails closed when unconfigured', async () => {
  const saved = { ...process.env };
  for (const k of ['LICENSE_DATABASE_URL', 'LICENSE_DB', 'VERCEL']) delete process.env[k];
  delete globalThis.__licenseStore;
  try {
    await assert.rejects(() => licenseStoreFromEnv({}), /not configured/);
    assert.deepEqual(await validateLicense('FZ-STARTER-anything'), { valid: false });
    await assert.rejects(() => licenseStoreFromEnv({ VERCEL: '1', LICENSE_DB: '/tmp/x.sqlite' }), /LICENSE_DATABASE_URL/);
    // configured: gate works end to end through the cached env store
    process.env.LICENSE_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lic-')), 'g.sqlite');
    Object.assign(process.env, env);
    delete globalThis.__licenseStore;
    const b = ev('evt_g', 'price_s');
    const { getLicenseWebhook } = await import('../lib/license.mjs');
    const lw = await getLicenseWebhook();
    assert.equal((await lw.handle(Buffer.from(b), sign(b))).body.handled, true);
    const [p] = await lw.pendingDeliveries();
    assert.deepEqual(await validateLicense(p.key), { valid: true, tier: 'starter' });
  } finally {
    const st = globalThis.__licenseStore; delete globalThis.__licenseStore;
    try { (await st)?.close?.(); } catch {}
    for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
    Object.assign(process.env, saved);
  }
});
