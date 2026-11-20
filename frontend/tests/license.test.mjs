import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildLicenseWebhook, priceTiersFromEnv } from '../lib/license.mjs';
import { JsonStore } from '../lib/vendor/license-webhook.mjs';

const SECRET = 'whsec_test_local';
const env = { STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_STARTER: 'price_s', STRIPE_PRICE_GROWTH: 'price_g' };
const sign = (body, t = Math.floor(Date.now() / 1000), secret = SECRET) =>
  `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;
const ev = (id, price, paid = 'paid') => JSON.stringify({ id, type: 'checkout.session.completed',
  data: { object: { id: 'cs_1', customer: 'cus_1', subscription: 'sub_1', payment_status: paid,
    metadata: { price_id: price }, customer_details: { email: 'buyer@example.com' } } } });
function setup() {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lic-')), 'db.json');
  const audits = [];
  const lw = buildLicenseWebhook({ env, audit: (r) => audits.push(r), store: new JsonStore(file) });
  return { lw, file, audits };
}

test('price->tier map from env, ignores empties and proto keys', () => {
  const m = priceTiersFromEnv(env);
  assert.equal(m.price_s, 'starter'); assert.equal(m.price_g, 'growth');
  assert.equal(m.constructor, undefined);
});

test('rejects bad / missing / stale signature, accepts good', () => {
  const { lw } = setup(); const b = ev('evt_1', 'price_s');
  assert.equal(lw.handle(Buffer.from(b), sign(b, undefined, 'wrong')).status, 400);
  assert.equal(lw.handle(Buffer.from(b), undefined).status, 400);
  assert.equal(lw.handle(Buffer.from(b), sign(b, 1000)).status, 400);
  assert.equal(lw.handle(Buffer.from(b + ' '), sign(b)).status, 400); // body altered after signing
  assert.equal(lw.handle(Buffer.from(b), sign(b)).status, 200);
});

test('paid checkout issues key: hash stored, plaintext only in outbox, validate works', () => {
  const { lw, file, audits } = setup(); const b = ev('evt_2', 'price_g');
  const out = lw.handle(Buffer.from(b), sign(b));
  assert.equal(out.body.handled, true);
  const [p] = lw.pendingDeliveries();
  assert.equal(p.tier, 'growth'); assert.match(p.key, /^FZ-GROWTH-/);
  assert.deepEqual(lw.validate(p.key), { valid: true, tier: 'growth' });
  assert.equal(lw.validate('FZ-GROWTH-nope').valid, false);
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(!JSON.stringify(db.licenses).includes(p.key));
  assert.ok(!JSON.stringify(audits).includes(p.key));
  lw.markDelivered(p.hash, 'owner');
  assert.equal(lw.pendingDeliveries().length, 0);
  assert.ok(!fs.readFileSync(file, 'utf8').includes(p.key));
  assert.throws(() => lw.markDelivered(p.hash, ''));
});

test('replay of same event id issues nothing more', () => {
  const { lw } = setup(); const b = ev('evt_3', 'price_s');
  lw.handle(Buffer.from(b), sign(b));
  const r = lw.handle(Buffer.from(b), sign(b));
  assert.equal(r.body.duplicate, true);
  assert.equal(lw.pendingDeliveries().length, 1);
});

test('unknown price and unpaid issue nothing; client tier cannot be chosen', () => {
  const { lw } = setup();
  const a = ev('evt_4', 'price_unknown'); assert.equal(lw.handle(Buffer.from(a), sign(a)).body.handled, false);
  const c = ev('evt_5', 'constructor'); assert.equal(lw.handle(Buffer.from(c), sign(c)).body.handled, false);
  const u = ev('evt_6', 'price_s', 'unpaid'); assert.equal(lw.handle(Buffer.from(u), sign(u)).body.handled, false);
  assert.equal(lw.pendingDeliveries().length, 0);
});

test('refund revokes', () => {
  const { lw } = setup(); const b = ev('evt_7', 'price_s'); lw.handle(Buffer.from(b), sign(b));
  const [p] = lw.pendingDeliveries();
  const r = JSON.stringify({ id: 'evt_8', type: 'customer.subscription.deleted', data: { object: { id: 'sub_1', customer: 'cus_1' } } });
  lw.handle(Buffer.from(r), sign(r));
  assert.equal(lw.validate(p.key).valid, false);
});
