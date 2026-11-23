// Explicit disposable target only; never read the application's DATABASE_URL or .env.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const target = process.env.TEST_DATABASE_URL;
const database = process.argv.includes('--recheck') ? 'appointments_e2e_recheck' : 'appointments_e2e';
assert.equal(target, `postgresql://appointments_test@127.0.0.1:55551/${database}`, 'Explicit disposable appointments target required');
const require = createRequire(import.meta.url);
const client = new pg.Client({ connectionString: target });
const pool = new pg.Pool({ connectionString: target });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const deliveries = []; let actor = { id: 'admin', email: 'admin@example.test', role: 'ADMIN', permissionKeys: ['contacts.view', 'contacts.manage'] };
await client.connect();
try {
  await client.query('CREATE TABLE "AdmissionInquiry" (id TEXT PRIMARY KEY, "guardianNames" TEXT NOT NULL, email TEXT NOT NULL)');
  await client.query(readFileSync('prisma/migrations/20261123190000_contact_appointment_invitations/migration.sql', 'utf8'));
  for (const id of ['one', 'two', 'three', 'four']) await client.query('INSERT INTO "AdmissionInquiry" VALUES ($1,$2,$3)', [id, `Familia ${id}`, `${id}@example.test`]);
  const cache = new Map();
  function load(file) {
    if (!/\.tsx?$/.test(file)) file += '.ts';
    if (cache.has(file)) return cache.get(file);
    const mod = { exports: {} }; cache.set(file, mod.exports);
    vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
      module: mod, exports: mod.exports, Date, Response, Request, URL, TextDecoder, Error, console,
      require(id) {
        if (id === 'server-only') return {};
        if (id === '@/lib/prisma') return { prisma };
        if (id === '@/lib/env') return { env: { APP_URL: 'https://appointments.example.test' } };
        if (id === '@/modules/auth/server/auth-guards') return { getAuthenticatedUser: async () => actor };
        if (id === '@/modules/users/server/invitation-token-cipher') return { encryptInvitationToken: value => `isolated:${value}`, decryptInvitationToken: value => value.slice(9) };
        if (id === './appointments.mail') return { deliverAppointmentMail: async (kind, record, token) => { deliveries.push({ kind, record: structuredClone(record), token }); return true; } };
        if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
        if (id.startsWith('.')) return load(new URL(id, `file:///${file}`).pathname.slice(1));
        return require(id);
      },
    });
    cache.set(file, mod.exports); return mod.exports;
  }
  const { appointmentHandlers: api } = load('src/modules/appointments/server/appointments.http.ts');
  const req = (body) => new Request('https://appointments.example.test/api/appointments', body ? { method: 'POST', headers: { origin: 'https://appointments.example.test', 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const date = offset => new Date(Date.now() + (96 * 60 + offset) * 60_000).toISOString();
  const start = date(0), alternate = date(60);
  const input = startsAt => ({ startsAt, durationMinutes: 30, mode: 'IN_PERSON', location: 'Koru' });
  const competing = await Promise.all(['one', 'two'].map(id => api.admin(req(input([start, alternate])), id)));
  assert.deepEqual(competing.map(r => r.status).sort(), [200, 409]);
  const winner = competing.findIndex(r => r.status === 200); const loser = winner === 0 ? 'two' : 'one'; const winnerId = winner === 0 ? 'one' : 'two';
  const offered = (await competing[winner].json()).invitation;
  assert.equal(offered.slots.length, 2); assert.equal('tokenHash' in offered, false); assert.equal('tokenCipher' in offered, false);
  const token = deliveries[0].token;
  actor = null;
  const before = await api.public(req(), token); assert.equal(before.status, 200); assert.equal((await before.json()).invitation.status, 'PENDING');
  const payload = { action: 'confirm', slotId: offered.slots[0].id };
  const confirmed = await Promise.all([api.public(req(payload), token), api.public(req(payload), token)]);
  for (const response of confirmed) { assert.equal(response.status, 200); assert.equal((await response.json()).invitation.status, 'CONFIRMED'); }
  assert.equal(deliveries.filter(d => d.kind === 'confirmation').length, 1);
  actor = { id: 'admin', email: 'admin@example.test', role: 'ADMIN', permissionKeys: ['contacts.view', 'contacts.manage'] };
  const blocked = await api.admin(req(input([offered.slots[0].startsAt])), 'three'); assert.equal(blocked.status, 409);
  const released = await api.admin(req(input([offered.slots[1].startsAt])), loser); assert.equal(released.status, 200);
  const pending = (await released.json()).invitation;
  const resend = await api.admin(req({ action: 'resend' }), loser, pending.id); assert.equal(resend.status, 200); assert.equal((await resend.json()).invitation.expiresAt, pending.expiresAt);
  const cancel = await api.admin(req({ action: 'cancel' }), loser, pending.id); assert.equal(cancel.status, 200);
  const reoffer = await api.admin(req(input([offered.slots[1].startsAt])), 'four'); assert.equal(reoffer.status, 200);
  const declineToken = deliveries.filter(d => d.kind === 'invitation').at(-1).token;
  actor = null; const rejected = await api.public(req({ action: 'reject' }), declineToken); assert.equal(rejected.status, 200); assert.equal((await rejected.json()).invitation.status, 'REJECTED');
  assert.equal(deliveries.filter(d => d.kind === 'rejection').length, 1);
  // Fixture simulates elapsed offered intervals while the invitation's 48-hour deadline is still future.
  // Setup only uses SQL; the acceptance assertions go through the actual HTTP interface.
  const elapsed = (await reoffer.json()).invitation;
  const pastStarts = new Date(Date.now() - 60 * 60_000).toISOString();
  const pastEnds = new Date(Date.now() - 30 * 60_000).toISOString();
  await client.query('UPDATE "AppointmentInvitation" SET status=\'PENDING\', slots=$2::jsonb, "lastEndsAt"=$3 WHERE id=$1', [elapsed.id, JSON.stringify([{ id: elapsed.slots[0].id, startsAt: pastStarts, endsAt: pastEnds }]), pastEnds]);
  actor = { id: 'admin', email: 'admin@example.test', role: 'ADMIN', permissionKeys: ['contacts.view', 'contacts.manage'] };
  const stillPending = await api.admin(req(), 'four'); assert.equal((await stillPending.json()).invitation.status, 'PENDING');
  const replacement = await api.admin(req(input([date(180)])), 'four');
  assert.equal(replacement.status, 409); assert.equal((await replacement.json()).error, 'Este contacto ya tiene una invitación o cita activa.');
  console.log('PASS real PostgreSQL migration and real repository through HTTP: concurrent overlapping allocation admits one; concurrent confirmation is idempotent; chosen slot stays held; other slot releases; cancel/reject release; resend keeps expiry; elapsed options do not permit replacing an unexpired pending invitation. Mail/auth/cipher isolated, no real mail or application database accessed.');
} finally { await prisma.$disconnect(); await client.end(); await pool.end(); }
