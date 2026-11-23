import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function moduleAt(file) { const mod = { exports: {} }; vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module: mod, exports: mod.exports, Response, Request, URL, TextDecoder, Error, require: name => name === './appointments.domain' ? moduleAt('src/modules/appointments/appointments.domain.ts') : require(name) }); return mod.exports; }
function setup(role = 'ADMIN', permissions = ['contacts.view', 'contacts.manage']) {
  const { createAppointmentHandlers } = moduleAt('src/modules/appointments/appointments.handler.ts');
  const calls = [];
  const service = Object.fromEntries(['latest', 'create', 'manage', 'publicView', 'respond'].map(key => [key, async (...args) => { calls.push([key, ...args]); return { status: 'PENDING' }; }]));
  return { calls, ...createAppointmentHandlers({ origin: 'https://koru.test', actor: async () => role ? ({ id: 'admin', email: 'admin@example.test', role, permissions }) : null, contact: async id => id === 'known' ? ({ id, name: 'Ana', email: 'ana@example.test' }) : null, service }) };
}
const request = (method, body, origin = 'https://koru.test') => new Request('https://koru.test/api/appointments', { method, headers: { ...(origin ? { origin } : {}), 'Content-Type': 'application/json' }, ...(method === 'GET' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
async function error(response, status, text) { assert.equal(response.status, status); assert.equal((await response.json()).error, text); assert.equal(response.headers.get('cache-control'), 'private, no-store'); }

test('admin and superadmin can schedule; other roles and missing permissions never call service', async () => {
  for (const role of ['ADMIN', 'SUPERADMIN']) { const h = setup(role); const r = await h.admin(request('POST', {}), 'known'); assert.equal(r.status, 200); assert.equal(h.calls[0][0], 'create'); }
  for (const role of [null, 'TEACHER', 'ADMIN_OPERATOR', 'PARENT']) { const h = setup(role); await error(await h.admin(request('POST', {}), 'known'), 403, 'Acceso no autorizado.'); assert.equal(h.calls.length, 0); }
  const h = setup('ADMIN', ['contacts.view']); await error(await h.admin(request('POST', {}), 'known'), 403, 'Acceso no autorizado.'); assert.equal(h.calls.length, 0);
});
test('origin, bounded input, missing contacts and unsupported methods reject without service writes', async () => {
  const h = setup();
  for (const origin of ['', 'https://attacker.test']) await error(await h.admin(request('POST', {}, origin), 'known'), 403, 'Origen no autorizado.');
  await error(await h.admin(request('POST', '{bad'), 'known'), 400, 'Datos no válidos.');
  await error(await h.admin(request('POST', 'x'.repeat(9000)), 'known'), 413, 'Solicitud demasiado grande.');
  await error(await h.admin(request('POST', {}), 'missing'), 404, 'Contacto no encontrado.');
  await error(await h.admin(request('DELETE', {}), 'known'), 405, 'Método no permitido.');
  assert.equal(h.calls.length, 0);
});
test('GET only reads, action payloads are strict and token routes require no account', async () => {
  const h = setup(); await h.admin(request('GET'), 'known'); assert.equal(h.calls[0][0], 'latest');
  await error(await h.admin(request('POST', { action: 'other' }), 'known', 'invitation'), 400, 'Acción no válida.');
  const p = setup(null); const token = 'a'.repeat(43);
  assert.equal((await p.public(request('GET'), token)).status, 200); assert.equal(p.calls[0][0], 'publicView');
  assert.equal((await p.public(request('POST', { action: 'confirm', slotId: 'slot' }), token)).status, 200); assert.equal(p.calls[1][0], 'respond');
  assert.equal((await p.public(request('POST', { action: 'reject' }), token)).status, 200);
  await error(await p.public(request('POST', { action: 'confirm', slotId: 'slot', email: 'injected' }), token), 400, 'Acción no válida.');
  await error(await p.public(request('GET'), 'invalid'), 404, 'Invitación no disponible.');
  await error(await p.public(request('POST', { action: 'reject' }, 'https://attacker.test'), token), 403, 'Origen no autorizado.');
  assert.equal(p.calls.length, 3);
});
