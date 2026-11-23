import test from 'node:test';
import assert from 'node:assert/strict';
import { admissionSchema } from '../../src/modules/admissions/admissions.schema';
import { submitAdmission } from '../../src/modules/admissions/submission';
import { parseContactQuery, authorizeContacts } from '../../src/modules/contacts/contacts.domain';
import { contactSchema } from '../../src/modules/contact/contact.schema';

const payload = () => ({ questionnaireVersion: 'initial-v1', idempotencyKey: '123e4567-e89b-42d3-a456-426614174000', answers: { childName: 'Ana', birthDate: '2020-02-29', age: 6, guardianNames: 'Familia Ana', phone: '+54 11 12345678', email: 'ana@example.com', city: 'Buenos Aires' } });
test('valid anonymous send persists validated answers once and retry is idempotent', async () => {
  let row: { fingerprint: string } | null = null; let writes = 0;
  const save = async (_key: string, fingerprint: string) => { if (row && row.fingerprint !== fingerprint) return false; if (!row) { row = { fingerprint }; writes++; } return true; };
  assert.deepEqual(await submitAdmission(payload(), save), { success: true, status: 200 });
  assert.deepEqual(await submitAdmission(payload(), save), { success: true, status: 200 });
  assert.equal(writes, 1);
  const changed = payload(); changed.answers.childName = 'Otra';
  assert.equal((await submitAdmission(changed, save)).status, 409); assert.equal(writes, 1);
});
test('invalid version, unknown keys, invalid dates/types and honeypot never write', async () => {
  let writes = 0; const save = async () => { writes++; return true; };
  for (const value of [ { ...payload(), questionnaireVersion: 'other' }, { ...payload(), extra: true }, { ...payload(), website: 'spam' }, { ...payload(), answers: { ...payload().answers, birthDate: '2020-02-30' } }, { ...payload(), answers: { ...payload().answers, age: '6' } }, { ...payload(), answers: { ...payload().answers, private: 'unknown' } }, { ...payload(), answers: { ...payload().answers, email: 'bad' } } ]) {
    assert.equal((await submitAdmission(value, save)).status, 400);
  }
  assert.equal(writes, 0);
});
test('all seven general answers required, narrative optional and bounded', () => {
  assert.equal(admissionSchema.safeParse(payload()).success, true);
  for (const key of Object.keys(payload().answers)) { const p = payload(); delete (p.answers as Record<string, unknown>)[key]; assert.equal(admissionSchema.safeParse(p).success, false, key); }
  assert.equal(admissionSchema.safeParse({ ...payload(), answers: { ...payload().answers, supportNeeds: 'x'.repeat(4001) } }).success, false);
});
test('telephone must contain a contactable number, not only punctuation', () => {
  assert.equal(admissionSchema.safeParse({ ...payload(), answers: { ...payload().answers, phone: '.....' } }).success, false);
  assert.equal(admissionSchema.safeParse({ ...payload(), answers: { ...payload().answers, phone: '+54 (11) 1234-5678' } }).success, true);
});
test('database failure never returns success', async () => {
  assert.deepEqual(await submitAdmission(payload(), async () => { throw new Error('private database detail'); }), { success: false, status: 500, error: 'No pudimos guardar el cuestionario. Intentá de nuevo.' });
});
test('default administrative access excludes roles without Contactos permissions', () => {
  for (const role of [null, 'PARENT', 'TEACHER', 'ADMIN_TEACHER']) assert.equal(authorizeContacts(role), false);
  assert.equal(authorizeContacts('ADMIN'), true);
  assert.equal(authorizeContacts('SUPERADMIN'), true);
});
test('contact query validates global filters and preserves defaults', () => {
  assert.deepEqual(parseContactQuery(new URLSearchParams()), { q: '', source: '', status: '', page: 1 });
  assert.equal(parseContactQuery(new URLSearchParams('page=0')), null);
  assert.equal(parseContactQuery(new URLSearchParams('source=other')), null);
  assert.equal(parseContactQuery(new URLSearchParams('status=READ&page=2'))?.page, 2);
});
test('existing public contact validation remains compatible', () => {
  assert.equal(contactSchema.safeParse({ nombre: 'Familia Ana', email: 'ana@example.com', telefono: '', mensaje: 'Quisiera conocer el proyecto.' }).success, true);
  assert.equal(contactSchema.safeParse({ nombre: '', email: 'bad', mensaje: '' }).success, false);
});
