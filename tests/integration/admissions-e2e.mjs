import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import pg from 'pg';
import { chromium } from '../../.tmp-admissions-e2e/browser/node_modules/playwright/index.mjs';

const base = process.env.ADMISSIONS_TEST_BASE_URL;
const target = process.env.TEST_DATABASE_URL;
if (base !== 'http://127.0.0.1:3109' || target !== 'postgresql://admissions_test@127.0.0.1:55549/admissions_schema_e2e') throw new Error('Explicit isolated test targets required');
const client = new pg.Client({ connectionString: target });
await client.connect();
// Reset only synthetic rows from this acceptance probe; the target is hard-pinned above.
await client.query('DELETE FROM "AdmissionInquiry" WHERE email = ANY($1::text[])', [['e2e@example.test', 'browser@example.test', 'fail@example.test']]);
await client.query('UPDATE "ContactMessage" SET status=\'REPLIED\' WHERE id=\'historical-contact\'');
await client.query('DROP TRIGGER IF EXISTS admissions_test_failure ON "AdmissionInquiry"; DROP FUNCTION IF EXISTS admissions_test_failure()');
const browser = await chromium.launch({ headless: true });
const results = [];
const check = async (name, run) => { await run(); results.push(name); console.log(`PASS ${name}`); };
const admin = await browser.newContext();
const parent = await browser.newContext();
const guest = await browser.newContext({ viewport: { width: 390, height: 844 } });
const password = 'Admissions-Disposable-Test-Only-2026!';
const answers = { childName: 'Niña de prueba', birthDate: '2020-02-29', age: 6, guardianNames: 'Familia E2E', phone: '+54 11 12345678', email: 'e2e@example.test', city: 'Ciudad', childDescription: '<script>window.admissionsXss=true</script>', supportNeeds: 'Información de prueba' };
const payload = { questionnaireVersion: 'initial-v1', idempotencyKey: randomUUID(), answers };
const list = async (query = '') => { const response = await admin.request.get(`${base}/api/dashboard/contacts${query}`); assert.equal(response.status(), 200, await response.text()); return response.json(); };
try {
  await check('real-session authentication and unauthorized private requests', async () => {
    for (const [context, email] of [[admin, 'admissions-admin@example.test'], [parent, 'admissions-parent@example.test']]) {
      const response = await context.request.post(`${base}/api/auth/sign-in/email`, { headers: { origin: base }, data: { email, password } });
      assert.equal(response.status(), 200, await response.text());
    }
    for (const context of [guest, parent]) {
      for (const url of ['/api/dashboard/contacts', '/api/dashboard/contacts/contact/historical-contact']) {
        const response = await context.request.get(base + url); assert.equal(response.status(), 403); assert.deepEqual(await response.json(), { error: 'Acceso no autorizado.' });
      }
      const mutation = await context.request.patch(`${base}/api/dashboard/contacts/contact/historical-contact`, { headers: { origin: base }, data: { status: 'NEW' } });
      assert.equal(mutation.status(), 403);
    }
  });
  await check('historical contacts and globally interleaved deterministic SQL pages/counts', async () => {
    const first = await list(); const second = await list('?page=2');
    assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(second.items.length, 5); assert.equal(second.total, 25);
    const rows = [...first.items, ...second.items];
    assert.equal(new Set(rows.map((row) => `${row.source}:${row.id}`)).size, 25);
    for (let index = 1; index < rows.length; index++) {
      const left = rows[index - 1], right = rows[index];
      assert.ok(left.receivedAt > right.receivedAt || (left.receivedAt === right.receivedAt && (left.source < right.source || left.source === right.source && left.id < right.id)));
    }
    assert.ok(rows.some((row) => row.id === 'historical-contact' && row.status === 'REPLIED'));
    for (const source of ['contact', 'admission']) {
      const page = await list(`?source=${source}`); assert.ok(page.items.every((row) => row.source === source));
    }
    const read = await list('?status=READ'); assert.ok(read.items.every((row) => row.status === 'READ'));
    assert.equal((await list('?q=does-not-exist')).total, 0);
    assert.equal((await list('?q=history%40example.test')).total, 1);
    for (const query of ['source=contact&source=admission', 'status=NEW&status=INVALID', 'page=1&page=0']) assert.equal((await admin.request.get(`${base}/api/dashboard/contacts?${query}`)).status(), 400);
    for (const source of ['contact', 'admission']) {
      const response = await admin.request.get(`${base}/api/dashboard/contacts/${source}/mixed-00`); assert.equal(response.status(), 200); assert.equal((await response.json()).item.source, source);
    }
  });
  const counterQuery = 'SELECT (SELECT count(*) FROM "user")::int AS users, (SELECT count(*) FROM "Family")::int AS families, (SELECT count(*) FROM "Student")::int AS students';
  const countersBefore = (await client.query(counterQuery)).rows;
  await check('concurrent same-send requests persist once; conflict and invalid input do not mutate', async () => {
    const before = (await list()).total;
    const responses = await Promise.all(Array.from({ length: 5 }, () => guest.request.post(`${base}/api/admissions`, { data: payload })));
    for (const response of responses) { assert.equal(response.status(), 200, await response.text()); assert.deepEqual(await response.json(), { success: true }); }
    assert.equal((await list()).total, before + 1);
    const conflicting = await guest.request.post(`${base}/api/admissions`, { data: { ...payload, answers: { ...answers, childName: 'Conflicting' } } }); assert.equal(conflicting.status(), 409);
    const invalid = await guest.request.post(`${base}/api/admissions`, { data: { ...payload, idempotencyKey: randomUUID(), answers: { ...answers, unexpected: 'not allowed' } } }); assert.equal(invalid.status(), 400);
    const oversized = await guest.request.post(`${base}/api/admissions`, { headers: { 'content-type': 'application/json' }, data: ' '.repeat(65537) }); assert.equal(oversized.status(), 400);
    assert.equal((await list()).total, before + 1);
    const matches = await list('?q=e2e%40example.test'); assert.equal(matches.total, 1);
    const detail = await admin.request.get(`${base}/api/dashboard/contacts/admission/${matches.items[0].id}`); const item = (await detail.json()).item;
    for (const [key, value] of Object.entries(answers)) assert.deepEqual(item.answers[key], value);
    assert.equal(item.questionnaireVersion, 'initial-v1');
    const second = await guest.request.post(`${base}/api/admissions`, { data: { ...payload, idempotencyKey: randomUUID() } }); assert.equal(second.status(), 200); assert.equal((await list('?q=e2e%40example.test')).total, 2);
    assert.deepEqual((await client.query(counterQuery)).rows, countersBefore);
  });
  await check('manual status changes persist; invalid/foreign-origin updates preserve prior state', async () => {
    const endpoint = `${base}/api/dashboard/contacts/contact/historical-contact`;
    const read = await admin.request.get(endpoint); assert.equal((await read.json()).item.status, 'REPLIED');
    const changed = await admin.request.patch(endpoint, { headers: { origin: base }, data: { status: 'READ' } }); assert.equal(changed.status(), 200);
    assert.equal((await (await admin.request.get(endpoint)).json()).item.status, 'READ');
    for (const [origin, data, expected] of [['https://other.test', { status: 'NEW' }, 403], [base, { status: 'INVALID' }, 400]]) {
      const response = await admin.request.patch(endpoint, { headers: { origin }, data }); assert.equal(response.status(), expected);
      assert.equal((await (await admin.request.get(endpoint)).json()).item.status, 'READ');
    }
  });
  await check('actual persistence failure returns safe error and no success or added inquiry', async () => {
    await client.query(`CREATE FUNCTION admissions_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.email = 'fail@example.test' THEN RAISE EXCEPTION 'isolated_test_failure_private'; END IF; RETURN NEW; END $$; CREATE TRIGGER admissions_test_failure BEFORE INSERT ON "AdmissionInquiry" FOR EACH ROW EXECUTE FUNCTION admissions_test_failure();`);
    const before = (await list()).total;
    const failed = await guest.request.post(`${base}/api/admissions`, { data: { ...payload, idempotencyKey: randomUUID(), answers: { ...answers, email: 'fail@example.test' } } });
    assert.equal(failed.status(), 500); assert.deepEqual(await failed.json(), { success: false, error: 'No pudimos guardar el cuestionario. Intentá de nuevo.' }); assert.equal((await list()).total, before);
    await client.query('DROP TRIGGER admissions_test_failure ON "AdmissionInquiry"; DROP FUNCTION admissions_test_failure()');
  });
  await check('mobile native form keyboard labels, pending guard, error retention and successful retry', async () => {
    const page = await guest.newPage();
    await page.goto(`${base}/admisiones/cuestionario-inicial`);
    await page.getByRole('heading', { name: 'CUESTIONARIO INICIAL DE VINCULACIÓN' }).waitFor();
    assert.equal(await page.locator('textarea').count(), 16); assert.equal(await page.locator('input[required]').count(), 7);
    for (const [key, value] of Object.entries({ ...answers, email: 'browser@example.test' })) await page.locator(`#${key}`).fill(String(value));
    await page.locator('#childName').focus(); await page.keyboard.press('Tab'); assert.equal(await page.locator('#birthDate').evaluate((element) => element === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    let sends = 0; let failFirst = true;
    await page.route('**/api/admissions', async (route) => {
      sends++;
      if (failFirst) { failFirst = false; await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Fallo de prueba, reintentá.' }) }); }
      else { await new Promise((resolve) => setTimeout(resolve, 200)); await route.continue(); }
    });
    await page.getByRole('button', { name: 'Enviar cuestionario', exact: true }).click();
    await page.getByText('Fallo de prueba, reintentá.', { exact: true }).waitFor(); assert.equal(await page.locator('#childName').inputValue(), answers.childName);
    const retry = page.getByRole('button', { name: 'Reintentar el mismo envío' }); await retry.click();
    assert.equal(await page.getByRole('button', { name: 'Enviando…' }).isDisabled(), true);
    await page.getByText('Recibimos su cuestionario inicial.', { exact: false }).waitFor(); assert.equal(sends, 2);
    await mkdir('.tmp-admissions-e2e/evidence', { recursive: true }); await page.screenshot({ path: '.tmp-admissions-e2e/evidence/mobile-confirmation.png', fullPage: true });
    assert.equal((await list('?q=browser%40example.test')).total, 1);
  });
  await check('dashboard renders source details inertly and preserves filtered back navigation', async () => {
    const page = await admin.newPage();
    await page.goto(`${base}/dashboard/contactos?q=e2e%40example.test&status=NEW&page=1`);
    await page.getByRole('heading', { name: 'Contactos', exact: true }).waitFor(); await page.getByRole('link', { name: /Ver detalle/ }).first().click();
    await page.getByRole('heading', { name: 'Detalle del contacto' }).waitFor(); await page.getByText(answers.childDescription, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.admissionsXss), undefined);
    assert.ok((await page.getByRole('link', { name: 'Volver a Contactos' }).getAttribute('href')).includes('q=e2e%40example.test'));
    await page.screenshot({ path: '.tmp-admissions-e2e/evidence/dashboard-detail.png', fullPage: true });
  });
  console.log(`PASS ${results.length} real PostgreSQL/API/browser acceptance groups`);
  await writeFile('.tmp-admissions-e2e/evidence/results.json', JSON.stringify({ passed: results, historicalMigrationChain: 'FAILED pre-existing dynamic-role migration; equivalent baseline used' }, null, 2));
} finally {
  await browser.close();
  await client.end();
}
