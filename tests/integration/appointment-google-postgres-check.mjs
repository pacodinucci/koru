// Explicit isolated database only; Google, auth and token cipher are fixtures, never real accounts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const target = process.env.TEST_DATABASE_URL;
assert.equal(target, 'postgresql://appointments_test@127.0.0.1:55551/appointments_google_e2e', 'Explicit disposable native appointment database required');
const require = createRequire(import.meta.url);
const client = new pg.Client({ connectionString: target }); const pool = new pg.Pool({ connectionString: target });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const events = new Map(); let cancelFails = false; let creates = 0;
let actor = { id: 'admin', email: 'admin@example.test', role: 'ADMIN', permissionKeys: ['contacts.view', 'contacts.manage'] };
const google = {
  getAppointmentGoogleConnection: async userId => ({ userId, accountId: `google-${userId}`, calendarId: 'primary' }),
  appointmentGoogleEventId: id => `test-${id}`,
  createAppointmentGoogleEvent: async (connection, input) => { creates++; assert.equal(connection.userId, actor.id); const event = { id: `test-${input.id}`, htmlLink: 'https://calendar.google.com/calendar/event?eid=test', status: 'confirmed', responseStatus: 'needsAction' }; events.set(input.id, event); return event; },
  getAppointmentGoogleEvent: async (_connection, id) => events.get(id) || null,
  cancelAppointmentGoogleEvent: async (_connection, id) => { if (cancelFails) throw Object.assign(new Error('timeout'), { outcome: 'unknown' }); events.delete(id); },
};
await client.connect();
try {
  await client.query('CREATE TABLE "AdmissionInquiry" (id TEXT PRIMARY KEY, "guardianNames" TEXT NOT NULL, email TEXT NOT NULL)');
  for (const migration of ['20261123190000_contact_appointment_invitations', '20261123210000_appointment_google_calendar']) await client.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, 'utf8'));
  for (const id of ['one', 'two', 'three']) await client.query('INSERT INTO "AdmissionInquiry" VALUES ($1,$2,$3)', [id, `Familia ${id}`, `${id}@example.test`]);
  const cache = new Map();
  function load(file) {
    if (!/\.tsx?$/.test(file)) file += '.ts'; if (cache.has(file)) return cache.get(file);
    const mod = { exports: {} }; cache.set(file, mod.exports);
    vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
      module: mod, exports: mod.exports, Date, Response, Request, URL, TextDecoder, Error, console,
      require(id) {
        if (id === 'server-only') return {};
        if (id === '@/lib/prisma') return { prisma };
        if (id === '@/lib/env') return { env: { APP_URL: 'https://appointments.example.test' } };
        if (id === '@/modules/auth/server/auth-guards') return { getAuthenticatedUser: async () => actor };
        if (id === '@/modules/users/server/invitation-token-cipher') return { encryptInvitationToken: value => `isolated:${value}`, decryptInvitationToken: value => value.slice(9) };
        if (id === './appointments.google') return google;
        if (id === './appointments.mail') return { deliverAppointmentMail: async () => { throw new Error('Custom mail must not be used for native invitations'); } };
        if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
        if (id.startsWith('.')) return load(new URL(id, `file:///${file}`).pathname.slice(1));
        return require(id);
      },
    }); cache.set(file, mod.exports); return mod.exports;
  }
  const { appointmentHandlers: api } = load('src/modules/appointments/server/appointments.http.ts');
  const req = body => new Request('https://appointments.example.test/api/appointments', body ? { method: 'POST', headers: { origin: 'https://appointments.example.test', 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const startsAt = new Date(Date.now() + 96 * 3600000).toISOString(); const input = { startsAt: [startsAt], durationMinutes: 30, mode: 'IN_PERSON', location: 'Koru' };
  const invalid = await api.admin(req({ ...input, startsAt: [startsAt, startsAt] }), 'one'); assert.equal(invalid.status, 400); assert.equal(creates, 0);
  const connection = await api.admin(req(), 'one'); assert.equal((await connection.json()).googleCalendar.connected, true);
  const competing = await Promise.all(['one', 'two'].map(id => api.admin(req(input), id)));
  assert.deepEqual(competing.map(response => response.status).sort(), [200, 409]); assert.equal(creates, 1);
  const winnerIndex = competing.findIndex(response => response.status === 200); const winnerContact = winnerIndex === 0 ? 'one' : 'two'; const loser = winnerIndex === 0 ? 'two' : 'one';
  const view = (await competing[winnerIndex].json()).invitation;
  assert.equal(view.provider, 'GOOGLE_CALENDAR'); assert.equal(view.canManageGoogle, true); assert.equal(view.slots.length, 1);
  assert.equal(view.expiresAt, view.slots[0].endsAt); assert.equal('googleAccountId' in view, false); assert.equal('tokenCipher' in view, false);
  actor = { ...actor, id: 'other-admin' };
  const denied = await api.admin(req({ action: 'sync' }), winnerContact, view.id); assert.equal(denied.status, 403);
  const readonly = (await (await api.admin(req(), winnerContact)).json()).invitation; assert.equal(readonly.canManageGoogle, false);
  actor = { ...actor, id: 'admin' };
  events.get(view.id).responseStatus = 'accepted';
  const confirmed = await api.admin(req({ action: 'sync' }), winnerContact, view.id); assert.equal(confirmed.status, 200); assert.equal((await confirmed.json()).invitation.status, 'CONFIRMED');
  assert.equal((await api.admin(req(input), loser)).status, 409);
  cancelFails = true; const failedCancel = await api.admin(req({ action: 'cancel' }), winnerContact, view.id); assert.equal(failedCancel.status, 502);
  assert.equal((await api.admin(req(input), loser)).status, 409, 'failed cancellation must retain the PostgreSQL interval');
  cancelFails = false; const retried = await api.admin(req({ action: 'sync' }), winnerContact, view.id); assert.equal((await retried.json()).invitation.status, 'CANCELLED');
  const released = await api.admin(req(input), loser); assert.equal(released.status, 200);
  console.log('PASS native migration + actual PostgreSQL repository/HTTP: single-slot rejection, connected organizer metadata, one concurrent winner, no PII binding leaks, organizer-only sync, RSVP confirmation, cancellation failure retains hold and explicit sync safely releases. Google/auth/cipher isolated; no mail or configured database accessed.');
} finally { await prisma.$disconnect(); await client.end(); await pool.end(); }
