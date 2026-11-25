import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import pg from 'pg';
import { chromium } from '../../.tmp-admissions-e2e/browser/node_modules/playwright/index.mjs';

/**
 * Candidate-family browser acceptance probe (ODD task odd/tasks/candidate-families.md S1/S2/S3).
 *
 * Runs against a disposable, loopback-only fixture prepared by
 * .tmp-admissions-e2e/candidates/browser/prepare.mjs and started by
 * .tmp-admissions-e2e/candidates/browser/launch-server.mjs.
 *
 * The server process preloads mail-fetch-preload.cjs, so:
 *   - all external network is refused (hard block at fetch/dns/tcp),
 *   - Resend is answered locally and the rendered provider payload is captured,
 * which is how this probe obtains real invitation links without sending mail.
 *
 * Pinned targets: http://127.0.0.1:3113 and the candidate_browser database on
 * 127.0.0.1:55553. No application source, no real data and no real email.
 */

const BASE_URL = 'http://127.0.0.1:3113';
const DATABASE_URL = 'postgresql://candidate_test@127.0.0.1:55553/candidate_browser';
if (process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL !== DATABASE_URL) {
  throw new Error('Explicit isolated test targets required');
}
if (process.env.CANDIDATE_BROWSER_BASE_URL && process.env.CANDIDATE_BROWSER_BASE_URL !== BASE_URL) {
  throw new Error('Explicit isolated test targets required');
}

const FIXTURE_DIR = path.join('.tmp-admissions-e2e', 'candidates', 'browser');
const EVIDENCE_DIR = path.join(FIXTURE_DIR, 'evidence');
const MAILS_FILE = path.join(EVIDENCE_DIR, 'mails.jsonl');
const BLOCKED_FILE = path.join(EVIDENCE_DIR, 'blocked-network.jsonl');
const SERVER_ENV_FILE = path.join(EVIDENCE_DIR, 'server-env.jsonl');

const BROWSERS_PATH = path.resolve('.tmp-admissions-e2e', 'browsers');
if (existsSync(BROWSERS_PATH) && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;
}

const ADMIN = { email: 'candidate.browser.admin@example.test', password: 'Candidate-Browser-Only-2026!' };
const ADMISSION = {
  id: 'candidate-browser-admission',
  guardianNames: 'Navegador Familia Admision',
  email: 'candidate.browser.family@example.test',
};
const SECOND_EMAIL = 'candidate.browser.second@example.test';
const REGULAR = { name: 'Navegador Familia Regular', emails: ['candidate.browser.regular@example.test'], password: 'Candidate-Browser-Family-2026!' };
const CANDIDATE = { name: 'Navegador Familia Candidata', emails: ['candidate.browser.pick1@example.test', 'candidate.browser.pick2@example.test'] };
const CANDIDATE_USER_PASSWORD = 'Candidate-Browser-Invitee-2026!';
const probeEmails = [...REGULAR.emails, ...CANDIDATE.emails, ADMISSION.email, SECOND_EMAIL];

const INVITATION_SUBJECT = 'Te invitaron a crear tu cuenta en Koru';
const FAKE_PROVIDER_PREFIX = 'mock-resend-';
const FAKE_API_KEY = 're_candidate_browser_fake_only_not_a_credential';

// ---------------------------------------------------------------------------
// Evidence helpers (append-only files written by the server preload)
// ---------------------------------------------------------------------------

async function readJsonLines(file) {
  const raw = await readFile(file, 'utf8').catch(() => '');
  return raw.split('\n').filter((line) => line.trim()).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

// A bounded continuation reuses the synthetic families created by the first run.
// CANDIDATE_BROWSER_RESUME=admission skips already observed creation/signup/conversion groups.
const resumeMode = process.env.CANDIDATE_BROWSER_RESUME;
const resumeAdmission = resumeMode === 'admission' || resumeMode === 'audit';
const mailsBaseline = resumeAdmission ? 0 : (await readJsonLines(MAILS_FILE)).length;
const blockedBaseline = (await readJsonLines(BLOCKED_FILE)).length;

async function capturedMails() {
  return (await readJsonLines(MAILS_FILE)).slice(mailsBaseline)
    .filter((entry) => (entry.recipients || []).some((email) => probeEmails.includes(email)));
}

async function blockedNetworkEvents() {
  return (await readJsonLines(BLOCKED_FILE)).slice(blockedBaseline);
}

function tokenFromHtml(html) {
  const match = /\/sign-up\?token=([A-Za-z0-9\-_%]+)/.exec(html || '');
  return match ? decodeURIComponent(match[1]) : null;
}

function mailFor(message, email) {
  const found = message.filter((entry) => (entry.recipients || []).includes(email));
  assert.equal(found.length, 1, `expected exactly one captured invitation for ${email}, got ${found.length}`);
  return found[0];
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
const one = async (sql, params = []) => (await client.query(sql, params)).rows[0];
const many = async (sql, params = []) => (await client.query(sql, params)).rows;

// ---------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------

const externalBrowserRequests = [];
const browser = await chromium.launch({ headless: true });

async function newGuardedContext(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  context.setDefaultTimeout(120000);
  context.setDefaultNavigationTimeout(180000);
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    externalBrowserRequests.push(url.toString());
    return route.abort();
  });
  return context;
}

const activeMenuItem = (page) => page.evaluate(() => {
  const element = document.activeElement;
  if (!element) return null;
  return element.getAttribute('role') === 'menuitem' ? (element.textContent || '').trim() : null;
});

/** Opens "Nueva familia" and selects an option using only the keyboard. */
async function selectNewFamilyKind(page, label) {
  const trigger = page.getByRole('button', { name: 'Nueva familia', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Familia', exact: true }).waitFor();
  let active = await activeMenuItem(page);
  for (let attempt = 0; attempt < 4 && active !== label; attempt += 1) {
    await page.keyboard.press('ArrowDown');
    active = await activeMenuItem(page);
  }
  assert.equal(active, label, `keyboard focus must land on the ${label} menu item`);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  return dialog;
}

async function closeDialog(page, dialog) {
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await dialog.waitFor({ state: 'hidden' });
}

function familyRow(page, name) {
  return page.getByRole('row').filter({ hasText: name });
}

async function invitationsFor(familyId) {
  return many(
    'SELECT id, email, status, "tokenVersion", "familyId", "tokenCiphertext" FROM "UserInvitation" WHERE "familyId" = $1 ORDER BY email',
    [familyId],
  );
}

async function deliveryJobsFor(familyId) {
  return many(
    'SELECT i.email, j.status, j."providerMessageId", j."sentAt" FROM "InvitationDeliveryJob" j JOIN "UserInvitation" i ON i.id = j."invitationId" WHERE i."familyId" = $1 ORDER BY i.email',
    [familyId],
  );
}

// ---------------------------------------------------------------------------
// Probe
// ---------------------------------------------------------------------------

const results = [];
const previousGroups = [];
let groupIndex = 0;
async function check(name, run) {
  groupIndex += 1;
  if (resumeAdmission && groupIndex < (resumeMode === 'audit' ? 8 : 7) && groupIndex !== 2) {
    previousGroups.push(name);
    console.log(`PREVIOUSLY VERIFIED ${name}`);
    return;
  }
  await run();
  results.push(name);
  console.log(`PASS ${name}`);
}

const adminContext = await newGuardedContext();
const adminPage = await adminContext.newPage();
let candidateFamilyId = null;

try {
  await check('disposable environment guards: loopback database, fake mail key, no real credentials', async () => {
    const envEntries = await readJsonLines(SERVER_ENV_FILE);
    assert.ok(envEntries.length > 0, 'server preload never recorded its environment');
    const env = envEntries[envEntries.length - 1];
    assert.deepEqual(env.database, { protocol: 'postgresql:', host: '127.0.0.1', port: '55553', path: 'candidate_browser', matchesPin: true });
    assert.equal(env.baseUrl, BASE_URL);
    assert.equal(env.baseUrlMatchesPin, true);
    assert.equal(env.appUrl, BASE_URL);
    assert.equal(env.appUrlMatchesPin, true);
    assert.equal(env.resendKeyIsFake, true);
    assert.equal(env.encryptionKeyBytes, 32);
    assert.deepEqual(env.forbiddenEnvVarsPresent, []);
    assert.equal(env.externalNetworkAllowed, false);
  });

  await check('real admin session and authenticated families dashboard', async () => {
    const response = await adminContext.request.post(`${BASE_URL}/api/auth/sign-in/email`, {
      headers: { origin: BASE_URL },
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    assert.equal(response.status(), 200, await response.text());
    await adminPage.goto(`${BASE_URL}/dashboard/families`);
    await adminPage.getByRole('heading', { name: 'Familias', exact: true }).waitFor();
    await adminPage.getByRole('button', { name: 'Nueva familia', exact: true }).waitFor();
  });

  await check('keyboard dropdown selects regular family, mail accepted, SQL stores FAMILY', async () => {
    const dialog = await selectNewFamilyKind(adminPage, 'Familia');
    await dialog.getByRole('heading', { name: 'Nueva familia', exact: true }).waitFor();
    await dialog.getByLabel('Nombre de la familia').fill(REGULAR.name);
    await dialog.getByLabel('Email principal').fill(REGULAR.emails[0]);
    await dialog.getByRole('button', { name: 'Crear familia' }).click();
    await dialog.getByRole('status').filter({ hasText: 'Familia creada' }).waitFor();
    assert.equal(
      (await dialog.getByRole('status').textContent())?.trim(),
      'Familia creada. El proveedor aceptó 1 invitación para enviar.',
    );
    await adminPage.screenshot({ path: path.join(EVIDENCE_DIR, 'regular-family-created.png'), fullPage: true });
    await closeDialog(adminPage, dialog);

    const family = await one('SELECT id, name, kind, "admissionInquiryId" FROM "Family" WHERE name = $1', [REGULAR.name]);
    assert.equal(family.kind, 'FAMILY');
    assert.equal(family.admissionInquiryId, null);
    const invitations = await invitationsFor(family.id);
    assert.deepEqual(invitations.map((row) => row.email), REGULAR.emails);
    const jobs = await deliveryJobsFor(family.id);
    assert.deepEqual(jobs.map((row) => row.status), ['SENT']);
    assert.match(jobs[0].providerMessageId, new RegExp(`^${FAKE_PROVIDER_PREFIX}`));

    const captured = await capturedMails();
    const mail = mailFor(captured, REGULAR.emails[0]);
    assert.equal(mail.subject, INVITATION_SUBJECT);
    assert.equal(mail.authorization, `Bearer ${FAKE_API_KEY}`);
    assert.equal(mail.provider, 'fake-resend-local');
    assert.ok(tokenFromHtml(mail.html), 'captured invitation html must contain an invitation link');
  });

  await check('keyboard dropdown selects candidate family, two mails captured, SQL stores CANDIDATE', async () => {
    const dialog = await selectNewFamilyKind(adminPage, 'Familia candidata');
    await dialog.getByRole('heading', { name: 'Nueva familia candidata', exact: true }).waitFor();
    await dialog.getByLabel('Nombre de la familia').fill(CANDIDATE.name);
    await dialog.getByLabel('Email principal').fill(CANDIDATE.emails[0]);
    await dialog.getByLabel('Segundo email (opcional)').fill(CANDIDATE.emails[1]);
    await dialog.getByRole('button', { name: 'Crear familia' }).click();
    await dialog.getByRole('status').filter({ hasText: 'Familia candidata creada' }).waitFor();
    assert.equal(
      (await dialog.getByRole('status').textContent())?.trim(),
      'Familia candidata creada. El proveedor aceptó 2 invitaciones para enviar.',
    );
    await adminPage.screenshot({ path: path.join(EVIDENCE_DIR, 'candidate-family-created.png'), fullPage: true });
    await closeDialog(adminPage, dialog);

    const family = await one('SELECT id, name, kind, "admissionInquiryId" FROM "Family" WHERE name = $1', [CANDIDATE.name]);
    candidateFamilyId = family.id;
    assert.equal(family.kind, 'CANDIDATE');
    assert.equal(family.admissionInquiryId, null);
    const invitations = await invitationsFor(family.id);
    assert.deepEqual(invitations.map((row) => row.email), [...CANDIDATE.emails].sort());
    assert.ok(invitations.every((row) => row.status === 'PENDING'));
    assert.ok(invitations.every((row) => typeof row.tokenCiphertext === 'string' && row.tokenCiphertext.length > 0));
    const jobs = await deliveryJobsFor(family.id);
    assert.deepEqual(jobs.map((row) => row.status), ['SENT', 'SENT']);
    assert.ok(jobs.every((row) => row.providerMessageId?.startsWith(FAKE_PROVIDER_PREFIX)));

    const captured = await capturedMails();
    for (const email of CANDIDATE.emails) {
      const mail = mailFor(captured, email);
      assert.equal(mail.subject, INVITATION_SUBJECT);
      assert.equal(mail.authorization, `Bearer ${FAKE_API_KEY}`);
      assert.ok(mail.html.includes(CANDIDATE.name), 'candidate invitation must render the family name');
      assert.ok(tokenFromHtml(mail.html), `invitation link missing for ${email}`);
    }
  });

  await check('captured invitation token signs up a real isolated user and reaches the existing family questionnaire', async () => {
    const captured = await capturedMails();
    const mail = mailFor(captured, CANDIDATE.emails[0]);
    const token = tokenFromHtml(mail.html);
    const inviteeContext = await newGuardedContext();
    const inviteePage = await inviteeContext.newPage();
    await inviteePage.goto(`${BASE_URL}/sign-up?token=${encodeURIComponent(token)}`);
    await inviteePage.getByRole('heading', { name: 'Crea tu usuario' }).waitFor();
    await inviteePage.getByLabel('Nombre').fill('Navegador Invitado');
    await inviteePage.getByLabel('Email').fill(CANDIDATE.emails[0]);
    await inviteePage.getByLabel('Contraseña', { exact: true }).fill(CANDIDATE_USER_PASSWORD);
    await inviteePage.getByLabel('Confirmar contraseña').fill(CANDIDATE_USER_PASSWORD);
    await inviteePage.getByRole('button', { name: 'Crear usuario' }).click();
    await inviteePage.waitForURL(/\/family-dashboard/, { timeout: 120000 });
    assert.equal(new URL(inviteePage.url()).pathname, '/family-dashboard');

    const questionnaireLink = inviteePage.getByRole('link', { name: /Cuestionario de ingreso/ });
    await questionnaireLink.waitFor();
    await questionnaireLink.click();
    await inviteePage.waitForURL(/\/family-dashboard\/cuestionario-ingreso/);
    await inviteePage.getByRole('heading', { name: 'Cuestionario de ingreso' }).waitFor();
    await inviteePage.getByText('Primero registrá a tu hijo/a desde Inicio.', { exact: true }).waitFor();
    await inviteePage.screenshot({ path: path.join(EVIDENCE_DIR, 'candidate-family-questionnaire.png'), fullPage: true });

    const user = await one('SELECT id, role, "familyId", "accessRoleId" FROM "user" WHERE email = $1', [CANDIDATE.emails[0]]);
    assert.equal(user.role, 'PARENT');
    assert.equal(user.accessRoleId, null);
    assert.equal(user.familyId, candidateFamilyId);
    const invitation = await one('SELECT status, "acceptedAt", "familyId" FROM "UserInvitation" WHERE email = $1', [CANDIDATE.emails[0]]);
    assert.equal(invitation.status, 'ACCEPTED');
    assert.ok(invitation.acceptedAt instanceof Date);
    assert.equal(invitation.familyId, candidateFamilyId);
    await inviteeContext.close();
  });

  await check('families list shows the candidate badge and conversion keeps the same identity and invitations', async () => {
    assert.ok(candidateFamilyId, 'candidate family must exist');
    const before = await one('SELECT id, name, kind, "admissionInquiryId", "createdAt", status FROM "Family" WHERE id = $1', [candidateFamilyId]);
    const beforeInvitations = await invitationsFor(candidateFamilyId);
    const beforeMembers = await many('SELECT id, email, role, "familyId" FROM "user" WHERE "familyId" = $1 ORDER BY email', [candidateFamilyId]);
    assert.equal(before.kind, 'CANDIDATE');
    assert.equal(beforeMembers.length, 1);

    await adminPage.goto(`${BASE_URL}/dashboard/families`);
    await adminPage.getByRole('heading', { name: 'Familias', exact: true }).waitFor();
    const row = familyRow(adminPage, CANDIDATE.name);
    await row.getByText('Candidata', { exact: true }).waitFor();
    const convert = row.getByRole('button', { name: 'Convertir en familia' });
    await convert.waitFor();
    await adminPage.screenshot({ path: path.join(EVIDENCE_DIR, 'candidate-badge.png'), fullPage: true });

    await convert.click();
    await row.getByRole('button', { name: 'Convertir en familia' }).waitFor({ state: 'detached' });
    await row.getByText('Candidata', { exact: true }).waitFor({ state: 'detached' });
    assert.equal(await row.getByText('Candidata', { exact: true }).count(), 0);
    await adminPage.screenshot({ path: path.join(EVIDENCE_DIR, 'candidate-converted.png'), fullPage: true });

    await adminPage.reload();
    await adminPage.getByRole('heading', { name: 'Familias', exact: true }).waitFor();
    const reloadedRow = familyRow(adminPage, CANDIDATE.name);
    assert.equal(await reloadedRow.getByText('Candidata', { exact: true }).count(), 0);
    assert.equal(await reloadedRow.getByRole('button', { name: 'Convertir en familia' }).count(), 0);
    await adminPage.screenshot({ path: path.join(EVIDENCE_DIR, 'candidate-converted-reload.png'), fullPage: true });

    const after = await one('SELECT id, name, kind, "admissionInquiryId", "createdAt", status FROM "Family" WHERE id = $1', [candidateFamilyId]);
    assert.deepEqual(after, { ...before, kind: 'FAMILY' });
    assert.deepEqual(await invitationsFor(candidateFamilyId), beforeInvitations);
    assert.deepEqual(await many('SELECT id, email, role, "familyId" FROM "user" WHERE "familyId" = $1 ORDER BY email', [candidateFamilyId]), beforeMembers);
  });

  await check('admission entry prefills editable name/email, accepts one optional email and creates a candidate', async () => {
    await adminPage.goto(`${BASE_URL}/dashboard/contactos/admission/${ADMISSION.id}`);
    await adminPage.getByRole('heading', { name: 'Detalle del contacto' }).waitFor();
    await adminPage.locator('p.break-all').filter({ hasText: ADMISSION.email }).waitFor();
    await adminPage.getByRole('button', { name: 'Crear familia candidata' }).click();
    const dialog = adminPage.getByRole('dialog');
    await dialog.getByRole('heading', { name: 'Nueva familia candidata', exact: true }).waitFor();

    const nameInput = dialog.getByLabel('Nombre de la familia');
    const primaryInput = dialog.getByLabel('Email principal');
    const secondaryInput = dialog.getByLabel('Segundo email (opcional)');
    assert.equal(await nameInput.inputValue(), ADMISSION.guardianNames);
    assert.equal(await primaryInput.inputValue(), ADMISSION.email);
    assert.equal(await nameInput.evaluate((element) => element.readOnly), false);
    assert.equal(await primaryInput.evaluate((element) => element.readOnly), false);
    await nameInput.fill(`${ADMISSION.guardianNames} editada`);
    await primaryInput.fill('edited-candidate@example.test');
    assert.equal(await nameInput.inputValue(), `${ADMISSION.guardianNames} editada`);
    assert.equal(await primaryInput.inputValue(), 'edited-candidate@example.test');
    // Restore fixture recipients for the cross-scenario audit below.
    await nameInput.fill(ADMISSION.guardianNames);
    await primaryInput.fill(ADMISSION.email);
    assert.equal(await secondaryInput.evaluate((element) => element.readOnly), false);
    assert.equal(await secondaryInput.inputValue(), '');
    assert.equal(await dialog.locator('input[type="email"]').count(), 2, 'prefilled primary and optional secondary email fields are both available');
    await dialog.getByRole('heading', { name: 'Nueva familia candidata', exact: true }).waitFor();

    await secondaryInput.fill(SECOND_EMAIL);
    await dialog.getByRole('button', { name: 'Crear familia' }).click();
    await dialog.getByRole('status').filter({ hasText: 'Familia candidata creada' }).waitFor();
    assert.equal(
      (await dialog.getByRole('status').textContent())?.trim(),
      'Familia candidata creada. El proveedor aceptó 2 invitaciones para enviar.',
    );
    await adminPage.screenshot({ path: path.join(EVIDENCE_DIR, 'admission-candidate-created.png'), fullPage: true });
    await closeDialog(adminPage, dialog);

    const family = await one('SELECT id, name, kind, "admissionInquiryId" FROM "Family" WHERE "admissionInquiryId" = $1', [ADMISSION.id]);
    assert.equal(family.name, ADMISSION.guardianNames);
    assert.equal(family.kind, 'CANDIDATE');
    const invitations = await invitationsFor(family.id);
    assert.deepEqual(invitations.map((row) => row.email), [ADMISSION.email, SECOND_EMAIL].sort());
    assert.equal(new Set(invitations.map((row) => row.email)).size, 2, 'no repeated email entry');
    const captured = await capturedMails();
    for (const email of [ADMISSION.email, SECOND_EMAIL]) {
      const mail = mailFor(captured, email);
      assert.equal(mail.subject, INVITATION_SUBJECT);
      assert.ok(mail.html.includes(ADMISSION.guardianNames));
    }
    await adminPage.goto(`${BASE_URL}/dashboard/families`);
    await adminPage.getByRole('heading', { name: 'Familias', exact: true }).waitFor();
    await familyRow(adminPage, ADMISSION.guardianNames).getByText('Candidata', { exact: true }).waitFor();
  });

  await check('normal family flow stays regular; candidate conversions persist; no real email egress', async () => {
    const regular = await one('SELECT id, kind, "admissionInquiryId" FROM "Family" WHERE name = $1', [REGULAR.name]);
    assert.equal(regular.kind, 'FAMILY');
    assert.equal(regular.admissionInquiryId, null);
    const regularRowLocator = familyRow(adminPage, REGULAR.name);
    assert.equal(await regularRowLocator.getByText('Candidata', { exact: true }).count(), 0);
    assert.equal(await regularRowLocator.getByRole('button', { name: 'Convertir en familia' }).count(), 0);

    const kinds = await many(
      'SELECT kind, count(*)::int AS count FROM "Family" WHERE name = ANY($1::text[]) OR "admissionInquiryId" = $2 GROUP BY kind ORDER BY kind',
      [[REGULAR.name, CANDIDATE.name, ADMISSION.guardianNames], ADMISSION.id],
    );
    assert.deepEqual(Object.fromEntries(kinds.map((row) => [row.kind, row.count])), { CANDIDATE: 1, FAMILY: 2 });

    const captured = await capturedMails();
    assert.equal(captured.length, 5, 'five invitations: one regular, two candidate, two admission');
    assert.ok(captured.every((entry) => entry.provider === 'fake-resend-local'));
    assert.ok(captured.every((entry) => entry.authorization === `Bearer ${FAKE_API_KEY}`));
    assert.ok(captured.every((entry) => entry.from === 'Koru Candidatos <candidatos@example.test>'));

    const providerIds = await many(
      'SELECT DISTINCT j."providerMessageId" FROM "InvitationDeliveryJob" j JOIN "UserInvitation" i ON i.id = j."invitationId" WHERE i.email = ANY($1::text[]) AND j."providerMessageId" IS NOT NULL',
      [probeEmails],
    );
    assert.equal(providerIds.length, 5);
    assert.ok(providerIds.every((row) => row.providerMessageId.startsWith(FAKE_PROVIDER_PREFIX)));

    const blocked = await blockedNetworkEvents();
    const providerAttempts = blocked.filter((entry) => JSON.stringify(entry.detail).includes('api.resend.com'));
    assert.deepEqual(providerAttempts, [], 'the real Resend API must never be contacted');
    const forbiddenHosts = blocked.filter((entry) => /smtp|mailgun|sendgrid|gmail|resend\.com/i.test(JSON.stringify(entry.detail)));
    assert.deepEqual(forbiddenHosts, [], 'no real mail transport may be attempted');
    assert.deepEqual(externalBrowserRequests, [], 'the browser must not reach any non-loopback origin');

    // Next forks workers, so the shared per-process summary can be overwritten by
    // a worker that sent nothing. The append-only capture and all five persisted
    // provider IDs above are the authoritative cross-process acceptance evidence.
  });

  await mkdir(EVIDENCE_DIR, { recursive: true });
  await writeFile(path.join(EVIDENCE_DIR, 'results.json'), `${JSON.stringify({
    passed: results,
    previouslyVerified: previousGroups,
    continuation: resumeAdmission,
    baseUrl: BASE_URL,
    database: 'candidate_browser@127.0.0.1:55553',
    fakeProviderMessages: (await capturedMails()).length,
    blockedNetworkEvents: (await blockedNetworkEvents()).length,
    externalBrowserRequests,
  }, null, 2)}\n`);
  console.log(`PASS ${results.length} candidate-family browser acceptance groups (no real email, disposable loopback data only)`);
} finally {
  await browser.close();
  await client.end();
}
