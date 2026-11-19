import test from 'node:test';
import assert from 'node:assert/strict';
import { admissionHandler } from '../../src/modules/admissions/handler';
import { createContactsHandler } from '../../src/modules/contacts/contacts.handler';
import type { ContactDetail } from '../../src/modules/contacts/contacts.domain';
const payload = { questionnaireVersion: 'initial-v1', idempotencyKey: '123e4567-e89b-42d3-a456-426614174000', answers: { childName: 'Ana', birthDate: '2020-01-01', age: 6, guardianNames: 'Familia Ana', phone: '1234567', email: 'ana@example.com', city: 'Ciudad' } };
const post = (body: string) => new Request('https://koru.test/api/admissions', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
test('public HTTP submission validates before writes and never exposes persistence errors', async () => {
  let writes = 0;
  const handler = admissionHandler(async () => { writes++; return true; });
  const success = await handler(post(JSON.stringify(payload)));
  assert.equal(success.status, 200); assert.deepEqual(await success.json(), { success: true }); assert.equal(writes, 1);
  for (const body of ['bad json', JSON.stringify({ ...payload, questionnaireVersion: 'bad' }), JSON.stringify({ ...payload, website: 'bot' }), ' '.repeat(65537)]) {
    const result = await handler(post(body)); assert.equal(result.status, 400); assert.equal((await result.json()).success, false);
  }
  assert.equal(writes, 1);
  const failed = await admissionHandler(async () => { throw new Error('database password'); })(post(JSON.stringify(payload)));
  assert.equal(failed.status, 500); assert.deepEqual(await failed.json(), { success: false, error: 'No pudimos guardar el cuestionario. Intentá de nuevo.' });
});
test('administrative HTTP rejects unauthorized reads and writes before accessing private records', async () => {
  let accesses = 0;
  for (const role of [null, 'PARENT', 'TEACHER', 'ADMIN_TEACHER']) {
    const handler = createContactsHandler({ role: async () => role, list: async () => { accesses++; return {}; }, detail: async () => { accesses++; return null; }, update: async () => { accesses++; return true; } });
    for (const method of ['GET', 'PATCH']) {
      const result = await handler(new Request('https://koru.test/api/dashboard/contacts/contact/same', { method }), { source: 'contact', id: 'same' });
      assert.equal(result.status, 403); assert.deepEqual(await result.json(), { error: 'Acceso no autorizado.' });
    }
    const list = await handler(new Request('https://koru.test/api/dashboard/contacts'));
    assert.equal(list.status, 403);
  }
  assert.equal(accesses, 0);
});
test('Contactos grants distinguish read and manage; Superadmin always inherits access', async () => {
  for (const [role, permissions, canRead, canWrite] of [
    ['SUPERADMIN', [], true, true],
    ['ADMIN', [], false, false],
    ['TEACHER', ['contacts.view'], true, false],
    ['TEACHER', ['contacts.manage'], false, false],
    ['TEACHER', ['contacts.view', 'contacts.manage'], true, true],
    ['PARENT', [], false, false],
  ] as [string, string[], boolean, boolean][]) {
    let reads = 0; let writes = 0;
    const handler = createContactsHandler({ role: async () => role, permissions: async () => permissions, list: async () => { reads++; return { items: [], total: 0 }; }, detail: async () => { reads++; return null; }, update: async () => { writes++; return true; } });
    const listed = await handler(new Request('https://koru.test/api/dashboard/contacts'));
    assert.equal(listed.status, canRead ? 200 : 403, `${role} ${permissions} list`);
    assert.equal(reads, canRead ? 1 : 0);
    const patch = await handler(new Request('https://koru.test/api/dashboard/contacts/contact/same', { method: 'PATCH', headers: { origin: 'https://koru.test' }, body: '{"status":"READ"}' }), { source: 'contact', id: 'same' });
    assert.equal(patch.status, canWrite ? 200 : 403, `${role} ${permissions} update`);
    assert.equal(writes, canWrite ? 1 : 0);
  }
});
test('configured public origin governs status writes when Next uses an internal request origin', async () => {
  let writes = 0;
  const dependencies = { origin: 'https://koru.test', role: async () => 'ADMIN', list: async () => ({}), detail: async () => null, update: async () => { writes++; return true; } };
  const handler = createContactsHandler(dependencies);
  const identity = { source: 'contact', id: 'same' };
  const request = (origin: string) => new Request('http://localhost:3109/api/dashboard/contacts/contact/same', { method: 'PATCH', headers: { origin, host: 'evil.test', 'x-forwarded-host': 'evil.test' }, body: '{"status":"READ"}' });
  const response = await handler(request('https://koru.test'), identity);
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { success: true }); assert.equal(writes, 1);
  for (const origin of ['http://localhost:3109', 'https://evil.test']) {
    const rejected = await handler(request(origin), identity);
    assert.equal(rejected.status, 403); assert.deepEqual(await rejected.json(), { error: 'Origen no autorizado.' });
  }
  assert.equal(writes, 1);
});
test('ambiguous repeated list filters return 400 before accessing records', async () => {
  let reads = 0;
  const handler = createContactsHandler({ role: async () => 'ADMIN', list: async () => { reads++; return { items: [], total: 0 }; }, detail: async () => null, update: async () => false });
  for (const query of ['source=contact&source=admission', 'status=NEW&status=INVALID', 'page=1&page=0', 'q=Ana&q=Otra', 'source=contact&source=contact']) {
    const response = await handler(new Request(`https://koru.test/api/dashboard/contacts?${query}`));
    assert.equal(response.status, 400, query);
    assert.deepEqual(await response.json(), { error: 'Filtros no válidos.' });
    assert.equal(reads, 0);
  }
  const valid = await handler(new Request('https://koru.test/api/dashboard/contacts?source=contact&status=NEW&page=1&q=Ana'));
  assert.equal(valid.status, 200); assert.equal(reads, 1);
});
test('composite IDs route safely, opening does not mutate, status failures retain stored state', async () => {
  const rows: Record<string, ContactDetail> = {
    contact: { source: 'contact', id: 'same', name: 'Histórico', email: 'a@example.com', phone: null, status: 'NEW', receivedAt: '2020-01-01T00:00:00.000Z', message: '<script>inert</script>' },
    admission: { source: 'admission', id: 'same', name: 'Nuevo', email: 'b@example.com', phone: '12345', status: 'NEW', receivedAt: '2026-01-01T00:00:00.000Z', answers: { childName: 'Ana' }, questionnaireVersion: 'initial-v1' },
  };
  let writes = 0; let fail = false;
  const handler = createContactsHandler({ role: async () => 'ADMIN', list: async () => ({}), detail: async (source, id) => id === 'same' ? rows[source] : null, update: async (source, id, status) => { if (fail) throw new Error('private'); if (id !== 'same') return false; rows[source].status = status; writes++; return true; } });
  for (const source of ['contact', 'admission']) {
    const response = await handler(new Request('https://koru.test/api/dashboard/contacts'), { source, id: 'same' });
    assert.equal(response.status, 200); assert.deepEqual((await response.json()).item, rows[source]);
  }
  assert.equal(writes, 0);
  const patch = (body: unknown, origin = 'https://koru.test') => new Request('https://koru.test/api/dashboard/contacts', { method: 'PATCH', headers: { origin }, body: JSON.stringify(body) });
  const identity = { source: 'contact', id: 'same' };
  assert.equal((await handler(patch({ status: 'READ' }, 'https://evil.test'), identity)).status, 403);
  assert.equal((await handler(patch({ status: 'READ', extra: 1 }), identity)).status, 400);
  assert.equal(writes, 0);
  assert.equal((await handler(patch({ status: 'READ' }), identity)).status, 200); assert.equal(rows.contact.status, 'READ'); assert.equal(rows.admission.status, 'NEW');
  fail = true;
  assert.equal((await handler(patch({ status: 'REPLIED' }), identity)).status, 500); assert.equal(rows.contact.status, 'READ'); assert.equal(writes, 1);
  assert.equal((await handler(new Request('https://koru.test'), { source: 'other', id: 'same' })).status, 404);
});
