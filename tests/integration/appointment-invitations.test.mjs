import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load() {
  const source = readFileSync('src/modules/appointments/appointments.domain.ts', 'utf8');
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module: mod, exports: mod.exports, Date, URL, Error, require });
  return mod.exports;
}
function setup() {
  const { createAppointmentService } = load();
  const records = []; const mails = []; let writes = 0; let now = new Date('2026-12-01T12:00:00Z'); let queue = Promise.resolve(); let mailFails = false; let seq = 0; let deliveryDelay = 0;
  const db = {
    async listActive() { return records; },
    async latest(id) { return records.filter(r => r.admissionId === id).at(-1) ?? null; },
    async find(id) { return records.find(r => r.id === id) ?? null; },
    async byHash(hash) { return records.find(r => r.tokenHash === hash) ?? null; },
    async insert(record) { writes++; records.push(record); return record; },
    async update(id, patch) { writes++; const r = records.find(r => r.id === id); Object.assign(r, patch); return r; },
  };
  const service = createAppointmentService({
    withLock: fn => { const result = queue.then(() => fn(db)); queue = result.catch(() => {}); return result; },
    now: () => now, id: () => `id-${++seq}`, token: () => `opaque-${++seq}`,
    hash: s => `hash:${s}`, seal: s => `sealed:${s}`, unseal: s => s.slice(7),
    async deliver(kind, record, token) { mails.push({ kind, record: structuredClone(record), token }); now = new Date(now.getTime() + deliveryDelay); return !mailFails; },
  });
  const actor = { id: 'admin', name: 'Admin', email: 'admin@example.test' };
  const contact = id => ({ id, name: 'Ana Pérez', email: `${id}@example.test` });
  const input = (startsAt = ['2026-12-05T16:00:00.000Z']) => ({ startsAt, durationMinutes: 30, mode: 'IN_PERSON', location: 'Koru', message: 'Nos vemos' });
  return { service, records, mails, actor, contact, input, count: () => writes, clock: date => { now = new Date(date); }, failMail: value => { mailFails = value; }, delayDelivery: ms => { deliveryDelay = ms; } };
}
async function rejectsUnchanged(h, action, message) {
  const before = JSON.stringify(h.records); const writes = h.count();
  await assert.rejects(action, error => error.message === message);
  assert.equal(JSON.stringify(h.records), before); assert.equal(h.count(), writes);
}
test('accepts one or three options and fixes expiry at 48h; resend never extends it', async () => {
  const h = setup();
  const one = await h.service.create(h.contact('one'), h.actor, h.input());
  assert.equal(one.slots.length, 1); assert.equal(one.status, 'PENDING');
  assert.equal(one.expiresAt, '2026-12-03T12:00:00.000Z');
  h.clock('2026-12-02T12:00:00Z');
  const again = await h.service.manage('one', one.id, 'resend');
  assert.equal(again.expiresAt, one.expiresAt); assert.equal(again.sentAt, one.sentAt);
  const three = await h.service.create(h.contact('three'), h.actor, h.input(['2026-12-06T15:00:00.000Z', '2026-12-06T16:00:00.000Z', '2026-12-06T17:00:00.000Z']));
  assert.equal(three.slots.length, 3); assert.equal(h.mails.filter(m => m.kind === 'invitation').length, 3);
  assert.equal('tokenHash' in three, false); assert.equal('tokenCipher' in three, false);
});
test('48-hour expiry starts only after successful delivery, not before a slow provider call', async () => {
  const h = setup(); h.delayDelivery(60_000);
  const result = await h.service.create(h.contact('one'), h.actor, h.input());
  assert.equal(result.sentAt, '2026-12-01T12:01:00.000Z');
  assert.equal(result.expiresAt, '2026-12-03T12:01:00.000Z');
});
test('pending contact cannot be replaced when all offered slots have passed before expiry', async () => {
  const h = setup(); await h.service.create(h.contact('one'), h.actor, h.input(['2026-12-01T12:15:00.000Z']));
  h.clock('2026-12-01T13:00:00Z');
  assert.equal((await h.service.latest('one')).status, 'PENDING');
  await rejectsUnchanged(h, () => h.service.create(h.contact('one'), h.actor, h.input()), 'Este contacto ya tiene una invitación o cita activa.');
});
test('rejects empty, four, duplicate, overlapping, invalid and past options without writes', async () => {
  const h = setup();
  const error = 'Elegí entre uno y tres horarios futuros, distintos y sin superposición.';
  for (const times of [[], Array(4).fill('2026-12-05T16:00:00.000Z'), ['bad'], ['2026-12-01T12:00:00.000Z'], ['2026-12-05T16:00:00.000Z', '2026-12-05T16:00:00.000Z'], ['2026-12-05T16:00:00.000Z', '2026-12-05T16:15:00.000Z']]) {
    await rejectsUnchanged(h, () => h.service.create(h.contact('one'), h.actor, h.input(times)), error);
  }
  await rejectsUnchanged(h, () => h.service.create(h.contact('one'), h.actor, { ...h.input(), mode: 'ONLINE', location: 'javascript:alert(1)' }), 'Ingresá un enlace HTTPS válido para la cita online.');
});
test('serializes concurrent overlapping offers and refuses an active replacement', async () => {
  const h = setup(); const result = await Promise.allSettled(['one', 'two'].map(id => h.service.create(h.contact(id), h.actor, h.input())));
  assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(result.find(r => r.status === 'rejected').reason.message, 'Uno de los horarios ya está reservado. Elegí otro.');
  await rejectsUnchanged(h, () => h.service.create(h.contact('one'), h.actor, h.input(['2026-12-07T16:00:00.000Z'])), 'Este contacto ya tiene una invitación o cita activa.');
});
test('confirmation is idempotent, retains chosen reservation and releases all other options', async () => {
  const h = setup(); const a = await h.service.create(h.contact('one'), h.actor, h.input(['2026-12-05T16:00:00.000Z', '2026-12-05T17:00:00.000Z']));
  const token = h.mails[0].token;
  const confirmed = await h.service.respond(token, { action: 'confirm', slotId: a.slots[0].id });
  assert.equal(confirmed.status, 'CONFIRMED'); assert.equal(confirmed.selectedSlotId, a.slots[0].id);
  const count = h.count(); const mails = h.mails.length;
  await h.service.respond(token, { action: 'confirm', slotId: a.slots[0].id });
  assert.equal(h.count(), count); assert.equal(h.mails.length, mails);
  await h.service.create(h.contact('two'), h.actor, h.input(['2026-12-05T17:00:00.000Z']));
  await rejectsUnchanged(h, () => h.service.create(h.contact('three'), h.actor, h.input()), 'Uno de los horarios ya está reservado. Elegí otro.');
  await rejectsUnchanged(h, () => h.service.respond(token, { action: 'reject' }), 'La invitación ya no admite esta acción.');
  await rejectsUnchanged(h, () => h.service.manage('one', a.id, 'cancel'), 'La invitación ya no admite esta acción.');
  assert.equal(h.mails.filter(m => m.kind === 'confirmation').length, 1);
});
test('expiry is enforced exactly at 48 hours without mutating on public GET', async () => {
  const h = setup(); const a = await h.service.create(h.contact('one'), h.actor, h.input()); const token = h.mails[0].token;
  h.clock('2026-12-03T11:59:59.999Z'); assert.equal((await h.service.publicView(token)).status, 'PENDING');
  h.clock('2026-12-03T12:00:00Z'); const writes = h.count();
  assert.equal((await h.service.publicView(token)).status, 'EXPIRED'); assert.equal(h.count(), writes);
  await rejectsUnchanged(h, () => h.service.respond(token, { action: 'confirm', slotId: a.slots[0].id }), 'La invitación ya no admite esta acción.');
  await h.service.create(h.contact('two'), h.actor, h.input());
});
test('reject and cancel release holds; invalid tokens and slots leave storage unchanged', async () => {
  for (const action of ['reject', 'cancel']) {
    const h = setup(); const a = await h.service.create(h.contact('one'), h.actor, h.input()); const token = h.mails[0].token;
    await rejectsUnchanged(h, () => h.service.respond('unknown', { action: 'reject' }), 'Invitación no disponible.');
    await rejectsUnchanged(h, () => h.service.respond(token, { action: 'confirm', slotId: 'unknown' }), 'Horario no disponible.');
    if (action === 'reject') await h.service.respond(token, { action }); else await h.service.manage('one', a.id, action);
    await h.service.create(h.contact('two'), h.actor, h.input());
    const view = await h.service.publicView(token); assert.equal(view.recipientName, 'Ana');
    for (const key of ['recipientEmail', 'initiatorEmail', 'admissionId', 'tokenHash', 'tokenCipher']) assert.equal(key in view, false);
  }
});
test('failed initial mail releases reservations; failed confirmation mail never loses booking and can be retried', async () => {
  const h = setup(); h.failMail(true);
  await assert.rejects(() => h.service.create(h.contact('one'), h.actor, h.input()), /No pudimos enviar la invitación/);
  assert.equal(h.records[0].status, 'SEND_FAILED');
  h.failMail(false); const a = await h.service.create(h.contact('two'), h.actor, h.input()); const token = h.mails.at(-1).token;
  h.failMail(true); const confirmed = await h.service.respond(token, { action: 'confirm', slotId: a.slots[0].id });
  assert.equal(confirmed.status, 'CONFIRMED'); assert.equal((await h.service.latest('two')).confirmationEmailFailed, true);
  h.failMail(false); const resent = await h.service.manage('two', a.id, 'resend');
  assert.equal(resent.confirmationEmailFailed, false); assert.equal(resent.status, 'CONFIRMED');
});
