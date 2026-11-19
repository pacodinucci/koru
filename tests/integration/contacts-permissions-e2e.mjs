import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '../../.tmp-admissions-e2e/browser/node_modules/playwright/index.mjs';
const base = process.env.ADMISSIONS_TEST_BASE_URL;
if (base !== 'http://127.0.0.1:3109' || process.env.TEST_DATABASE_URL !== 'postgresql://admissions_test@127.0.0.1:55549/admissions_schema_e2e') throw new Error('Explicit isolated targets required');
const browser = await chromium.launch({ headless: true });
const contexts = {};
const passed = [];
const remainingOnly = process.argv.includes('--remaining');
const check = async (name, probe) => {
  if (remainingOnly && name.startsWith('Superadmin inherits')) { console.log(`PREVIOUSLY VERIFIED ${name}`); return; }
  await probe(); passed.push(name); console.log(`PASS ${name}`);
};
try {
  for (const role of ['super','reader','manager','restricted']) {
    // Respect the production sign-in throttle; do not disable guards for browser fixtures.
    if (role !== 'super') await new Promise((resolve) => setTimeout(resolve, 11000));
    const context = await browser.newContext(); contexts[role] = context;
    const response = await context.request.post(`${base}/api/auth/sign-in/email`, { headers: { origin: base }, data: { email: `contacts-${role}@example.test`, password: 'Admissions-Disposable-Test-Only-2026!' } });
    assert.equal(response.status(), 200, await response.text());
  }
  await check('Superadmin inherits full navigation, Contactos and Roles access', async () => {
    assert.equal((await contexts.super.request.get(`${base}/api/dashboard/contacts`)).status(), 200);
    const patch = await contexts.super.request.patch(`${base}/api/dashboard/contacts/contact/historical-contact`, { headers: { origin: base }, data: { status: 'READ' } }); assert.equal(patch.status(), 200);
    const page = await contexts.super.newPage(); await page.goto(`${base}/dashboard/roles`);
    await page.getByRole('button', { name: 'Crear rol', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Contactos', exact: true }).waitFor();
    assert.ok(await page.locator('legend').filter({ hasText: /^Contactos$/ }).count() >= 6);
    const form = page.locator('form').filter({ has: page.locator('input[name="id"][value="test_role_superadmin"]') });
    for (const permission of ['contacts.view','contacts.manage']) assert.equal(await form.locator(`input[type="checkbox"][value="${permission}"]`).isChecked(), true);
    await mkdir('.tmp-admissions-e2e/evidence', { recursive: true });
    await page.screenshot({ path: '.tmp-admissions-e2e/evidence/roles-contactos.png', fullPage: true });
  });
  await check('delegated view-only can read but cannot mutate; restricted ADMIN cannot read', async () => {
    const response = await contexts.reader.request.get(`${base}/api/dashboard/contacts`); assert.equal(response.status(), 200);
    const denied = await contexts.reader.request.patch(`${base}/api/dashboard/contacts/contact/historical-contact`, { headers: { origin: base }, data: { status: 'NEW' } }); assert.equal(denied.status(), 403); assert.deepEqual(await denied.json(), { error: 'Acceso no autorizado.' });
    for (const suffix of ['', '/contact/historical-contact']) assert.equal((await contexts.restricted.request.get(`${base}/api/dashboard/contacts${suffix}`)).status(), 403);
    const page = await contexts.reader.newPage(); await page.goto(`${base}/dashboard/contactos/contact/historical-contact`);
    await page.getByRole('heading', { name: 'Detalle del contacto' }).waitFor();
    const select = page.getByRole('combobox', { name: 'Estado', exact: true }); await select.waitFor(); assert.equal(await select.isDisabled(), true);
    const restricted = await contexts.restricted.newPage(); await restricted.goto(`${base}/dashboard`);
    assert.equal(await restricted.getByRole('link', { name: 'Contactos', exact: true }).count(), 0);
    const item = await contexts.super.request.get(`${base}/api/dashboard/contacts/contact/historical-contact`); assert.equal((await item.json()).item.status, 'READ');
  });
  await check('delegated view plus manage permits persisted manual status changes', async () => {
    const patch = await contexts.manager.request.patch(`${base}/api/dashboard/contacts/contact/historical-contact`, { headers: { origin: base }, data: { status: 'REPLIED' } }); assert.equal(patch.status(), 200);
    const response = await contexts.manager.request.get(`${base}/api/dashboard/contacts/contact/historical-contact`); assert.equal((await response.json()).item.status, 'REPLIED');
  });
  await check('Roles saves Contactos grants and revocation takes effect on next request', async () => {
    const page = await contexts.super.newPage(); await page.goto(`${base}/dashboard/roles`);
    const form = page.locator('form').filter({ has: page.locator('input[name="id"][value="test_role_reader"]') });
    const manage = form.locator('input[type="checkbox"][name="permissions"][value="contacts.manage"]');
    await manage.check();
    await Promise.all([page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/dashboard/roles')), form.getByRole('button', { name: 'Guardar permisos' }).click()]);
    await page.reload();
    assert.equal(await page.locator('form').filter({ has: page.locator('input[name="id"][value="test_role_reader"]') }).locator('input[type="checkbox"][value="contacts.manage"]').isChecked(), true);
    const updated = await contexts.reader.request.patch(`${base}/api/dashboard/contacts/contact/historical-contact`, { headers: { origin: base }, data: { status: 'READ' } }); assert.equal(updated.status(), 200);
    const restoredForm = page.locator('form').filter({ has: page.locator('input[name="id"][value="test_role_reader"]') });
    await restoredForm.locator('input[type="checkbox"][value="contacts.manage"]').uncheck();
    await Promise.all([page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/dashboard/roles')), restoredForm.getByRole('button', { name: 'Guardar permisos' }).click()]);
    const rejected = await contexts.reader.request.patch(`${base}/api/dashboard/contacts/contact/historical-contact`, { headers: { origin: base }, data: { status: 'NEW' } }); assert.equal(rejected.status(), 403);
  });
  await writeFile('.tmp-admissions-e2e/evidence/contacts-permissions-results.json', JSON.stringify({ passed }, null, 2));
  console.log(`PASS ${passed.length} real-session role and capability browser checks`);
} finally { await browser.close(); }
