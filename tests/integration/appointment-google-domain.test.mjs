import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module: loadedModule, exports: loadedModule.exports, Date, Error, URL, console,
    require: name => { if (name === './appointments.domain') return load('src/modules/appointments/appointments.domain.ts'); throw new Error(name); },
  });
  return loadedModule.exports;
}
const { createGoogleAppointmentService } = load('src/modules/appointments/appointments.google.domain.ts');
function fixture() {
  const rows = new Map(); let serial = Promise.resolve(); let count = 0; let clock = new Date('2099-01-01T00:00:00Z');
  const calls = []; let connected = true; let createError; let cancelError; let responseStatus = 'needsAction'; let eventExists = true;
  const connection = { userId: 'organizer', accountId: 'google-sub', calendarId: 'primary' };
  const event = () => ({ id: 'g-event', htmlLink: 'https://calendar.google.com/calendar/event?eid=opaque', status: 'confirmed', responseStatus });
  const store = {
    listActive: async () => [...rows.values()].filter(row => ['SENDING', 'PENDING', 'CONFIRMED'].includes(row.status) && row.expiresAt > clock),
    latest: async admissionId => [...rows.values()].filter(row => row.admissionId === admissionId).at(-1) || null,
    find: async id => rows.get(id) || null, byHash: async hash => [...rows.values()].find(row => row.tokenHash === hash) || null,
    insert: async row => { rows.set(row.id, row); return row; },
    update: async (id, patch) => { const row = { ...rows.get(id), ...patch }; rows.set(id, row); return row; },
  };
  const deps = {
    withLock: action => { const next = serial.then(() => action(store)); serial = next.catch(() => {}); return next; },
    now: () => clock, id: () => `id-${++count}`, token: () => `token-${++count}`, hash: value => `hash-${value}`, seal: value => `sealed-${value}`,
    deliverVisit: async row => { calls.push(['visit-mail', row]); return true; },
    legacy: { latest: async () => null, manage: async () => { calls.push('legacy-manage'); }, publicView: async () => { calls.push('legacy-public'); }, respond: async () => { calls.push('legacy-respond'); } },
    google: {
      connection: async userId => { calls.push(['connection', userId]); if (!connected) throw Object.assign(new Error('Conectá Google Calendar.'), { outcome: 'unavailable' }); return connection; },
      eventId: id => `event-${id}`,
      create: async (conn, input) => { calls.push(['create', conn, input]); if (createError) throw createError; return event(); },
      get: async (conn, id) => { calls.push(['get', conn, id]); return eventExists ? event() : null; },
      cancel: async (conn, id) => { calls.push(['cancel', conn, id]); if (cancelError) throw cancelError; eventExists = false; },
    },
  };
  return { service: createGoogleAppointmentService(deps), rows, calls, connection, deps,
    advance: hours => { clock = new Date(clock.getTime() + hours * 3600000); },
    disconnect: () => { connected = false; }, response: value => { responseStatus = value; },
    failCreate: outcome => { createError = Object.assign(new Error('provider details must stay private'), { outcome }); },
    restoreCreate: () => { createError = undefined; }, failCancel: () => { cancelError = Object.assign(new Error('timeout'), { outcome: 'unknown' }); }, restoreCancel: () => { cancelError = undefined; },
  };
}
const actor = { id: 'organizer', email: 'admin@example.test' };
const contact = { id: 'contact', name: 'Ana Familia', email: 'family@example.test' };
const input = { startsAt: ['2099-01-10T16:00:00.000Z'], durationMinutes: 30, mode: 'IN_PERSON', location: 'Koru' };
test('single native invite uses scheduling admin and remains reserved beyond 48h; rejects multiple slots without writes', async () => {
  const f = fixture();
  await assert.rejects(f.service.create(contact, actor, { ...input, startsAt: [...input.startsAt, '2099-01-11T16:00:00.000Z'] }), error => error.status === 400);
  assert.equal(f.rows.size, 0); assert.equal(f.calls.filter(call => call[0] === 'create').length, 0);
  const view = await f.service.create(contact, actor, input);
  assert.equal(view.provider, 'GOOGLE_CALENDAR'); assert.equal(view.status, 'PENDING'); assert.equal(view.googleRsvpStatus, 'needsAction');
  const create = f.calls.find(call => call[0] === 'create'); assert.equal(create[1].userId, actor.id); assert.equal(create[2].recipientEmail, contact.email);
  assert.equal(create[2].startsAt, input.startsAt[0]); assert.equal(create[2].endsAt, '2099-01-10T16:30:00.000Z');
  f.advance(72);
  assert.equal((await f.service.latest(contact.id, actor)).status, 'PENDING');
  await assert.rejects(f.service.create({ ...contact, id: 'other' }, actor, input), error => error.status === 409);
  assert.equal(f.rows.size, 1);
});
test('disconnected Google never inserts reservation or calls provider create', async () => {
  const f = fixture(); f.disconnect();
  await assert.rejects(f.service.create(contact, actor, input), error => error.status === 409 && error.message === 'Conectá tu cuenta de Google Calendar desde Calendario para agendar la cita.');
  assert.equal(f.rows.size, 0); assert.equal(f.calls.some(call => call[0] === 'create'), false);
});
test('RSVP refresh is explicit and organizer-only; tentative holds, accepted confirms, declined releases', async () => {
  const f = fixture(); const view = await f.service.create(contact, actor, input); const before = f.calls.length;
  await f.service.latest(contact.id, actor); assert.equal(f.calls.length, before, 'GET is read-only, no provider call');
  await assert.rejects(f.service.manage(contact.id, view.id, 'sync', { id: 'other-admin' }), error => error.status === 403);
  f.response('tentative'); assert.equal((await f.service.manage(contact.id, view.id, 'sync', actor)).googleRsvpStatus, 'tentative');
  await assert.rejects(f.service.create({ ...contact, id: 'other' }, actor, input), error => error.status === 409);
  f.response('accepted'); const confirmed = await f.service.manage(contact.id, view.id, 'sync', actor);
  assert.equal(confirmed.status, 'CONFIRMED'); assert.equal(confirmed.selectedSlotId, confirmed.slots[0].id);
  f.response('declined'); assert.equal((await f.service.manage(contact.id, view.id, 'sync', actor)).status, 'REJECTED');
  assert.ok(f.calls.some(call => call[0] === 'cancel'), 'Google invitation must be withdrawn before releasing a declined interval');
  await f.service.create({ ...contact, id: 'other' }, actor, input); assert.equal(f.rows.size, 2);
  f.response('accepted'); assert.equal((await f.service.manage(contact.id, view.id, 'sync', actor)).status, 'REJECTED', 'a late RSVP cannot resurrect a withdrawn invitation');
});
test('confirmed native cancellation updates same Google event before releasing reservation', async () => {
  const f = fixture(); const view = await f.service.create(contact, actor, input); f.response('accepted');
  await f.service.manage(contact.id, view.id, 'sync', actor); f.failCancel();
  await assert.rejects(f.service.manage(contact.id, view.id, 'cancel', actor), error => error.status === 502);
  await assert.rejects(f.service.create({ ...contact, id: 'other' }, actor, input), error => error.status === 409);
  assert.equal((await f.service.latest(contact.id, actor)).googleSyncPending, true);
  f.restoreCancel(); const cancelled = await f.service.manage(contact.id, view.id, 'sync', actor);
  assert.equal(cancelled.status, 'CANCELLED');
  await f.service.create({ ...contact, id: 'other' }, actor, input); assert.equal(f.rows.size, 2);
});
test('ambiguous initial creation retains hold and explicit refresh recovers same deterministic event, no false send', async () => {
  const f = fixture(); f.failCreate('unknown'); const uncertain = await f.service.create(contact, actor, input);
  assert.equal(uncertain.googleSyncPending, true); assert.equal(uncertain.sentAt, null);
  await assert.rejects(f.service.create({ ...contact, id: 'other' }, actor, input), error => error.status === 409);
  await assert.rejects(f.service.manage(contact.id, uncertain.id, 'cancel', actor), error => error.status === 409);
  f.restoreCreate(); const recovered = await f.service.manage(contact.id, uncertain.id, 'sync', actor);
  assert.equal(recovered.googleSyncPending, false); assert.ok(recovered.sentAt); assert.equal(recovered.id, uncertain.id); assert.equal(f.rows.size, 1);
});
test('definitive provider rejection releases hold and never exposes provider errors', async () => {
  const f = fixture(); f.failCreate('rejected');
  await assert.rejects(f.service.create(contact, actor, input), error => error.status === 502 && !error.message.includes('provider details'));
  assert.equal([...f.rows.values()][0].status, 'SEND_FAILED');
  f.restoreCreate(); await f.service.create(contact, actor, input);
});
test('two concurrent overlapping proposals have one winner and legacy invitations retain legacy behavior', async () => {
  const f = fixture(); const result = await Promise.allSettled([f.service.create(contact, actor, input), f.service.create({ ...contact, id: 'other' }, actor, input)]);
  assert.equal(result.filter(row => row.status === 'fulfilled').length, 1); assert.equal(f.rows.size, 1);
  f.rows.set('legacy', { id: 'legacy', admissionId: 'legacy-contact', status: 'PENDING', slots: [], expiresAt: new Date('2099-01-03'), createdAt: new Date('2099-01-01') });
  await f.service.manage('legacy-contact', 'legacy', 'resend', actor); assert.ok(f.calls.includes('legacy-manage'));
  await f.service.publicView('legacy-token'); await f.service.respond('legacy-token', { action: 'reject' });
  assert.ok(f.calls.includes('legacy-public')); assert.ok(f.calls.includes('legacy-respond'));
});

test('stale initial rejection cannot release a recovered live Google event', async () => {
  const f = fixture(); let failOriginal; let entered; const ready = new Promise(resolve => { entered = resolve; }); let remoteExists = false;
  f.deps.google.create = async () => { entered(); return new Promise((_, reject) => { failOriginal = reject; }); };
  const initial = f.service.create(contact, actor, input);
  const outcome = initial.then(value => ({ value }), error => ({ error }));
  await ready; const row = [...f.rows.values()][0];
  f.deps.google.get = async () => null;
  f.deps.google.create = async () => { remoteExists = true; return { id: row.googleEventId, status: 'confirmed', responseStatus: 'needsAction', htmlLink: null }; };
  const recovered = await f.service.manage(contact.id, row.id, 'sync', actor); assert.equal(recovered.status, 'PENDING');
  failOriginal(Object.assign(new Error('older token rejected after recovery succeeded'), { outcome: 'rejected' }));
  const result = await outcome; assert.equal(remoteExists, true); assert.equal(f.rows.get(row.id).status, 'PENDING');
  assert.equal(result.value.status, 'PENDING');
  await assert.rejects(f.service.create({ ...contact, id: 'second' }, actor, input), error => error.status === 409 && error.message === 'El horario ya está reservado. Elegí otro.');
});

test('native invitation also sends Koru visit details once; RSVP refresh does not resend', async () => {
  const f = fixture(); const view = await f.service.create(contact, actor, input);
  const mails = f.calls.filter(call => call[0] === 'visit-mail');
  assert.equal(mails.length, 1);
  assert.equal(mails[0][1].recipientEmail, contact.email);
  assert.equal(mails[0][1].slots[0].startsAt, input.startsAt[0]);
  assert.equal(mails[0][1].googleEventUrl, view.googleEventUrl);
  assert.equal(f.calls.filter(call => call[0] === 'create').length, 1);
  f.response('accepted'); await f.service.manage(contact.id, view.id, 'sync', actor);
  assert.equal(f.calls.filter(call => call[0] === 'visit-mail').length, 1);
});
test('failed Koru email preserves native booking and explicit refresh retries only Koru email', async () => {
  const f = fixture(); f.deps.deliverVisit = async () => { throw new Error('Resend unavailable'); };
  const view = await f.service.create(contact, actor, input);
  assert.equal(view.status, 'PENDING'); assert.equal(view.confirmationEmailFailed, true);
  await assert.rejects(f.service.create({ ...contact, id: 'other' }, actor, input), error => error.status === 409);
  let retries = 0; f.deps.deliverVisit = async () => { retries++; return true; };
  const refreshed = await f.service.manage(contact.id, view.id, 'sync', actor);
  assert.equal(refreshed.confirmationEmailFailed, false); assert.equal(retries, 1);
  assert.equal(f.calls.filter(call => call[0] === 'create').length, 1);
});
test('uncertain or rejected Google creation does not send Koru mail; recovery sends it', async () => {
  const f = fixture(); f.failCreate('unknown'); const view = await f.service.create(contact, actor, input);
  assert.equal(f.calls.filter(call => call[0] === 'visit-mail').length, 0);
  f.restoreCreate(); await f.service.manage(contact.id, view.id, 'sync', actor);
  assert.equal(f.calls.filter(call => call[0] === 'visit-mail').length, 1);
  const rejected = fixture(); rejected.failCreate('rejected');
  await assert.rejects(rejected.service.create(contact, actor, input), error => error.status === 502);
  assert.equal(rejected.calls.filter(call => call[0] === 'visit-mail').length, 0);
});
