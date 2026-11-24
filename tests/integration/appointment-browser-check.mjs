// Real browser + React components, isolated API fixtures. No Next auth, production DB or real mail.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium } from '../../.tmp-admissions-e2e/browser/node_modules/playwright/index.mjs';
const bundle = await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {ContactDetail} from './src/modules/contacts/views/contact-detail'; import {AppointmentFamilyView} from './src/modules/appointments/views/appointment-family-view'; window.mount=(family=false)=>createRoot(document.getElementById('root')).render(family?React.createElement(AppointmentFamilyView,{token:'a'.repeat(43)}):React.createElement(ContactDetail,{source:'admission',id:'inquiry',canManage:true,canSchedule:true}));`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"test"' }, plugins: [{ name: 'isolated-next-routing', setup(builder) { builder.onResolve({ filter: /^next\/(navigation|link)$/ }, args => ({ path: args.path, namespace: 'test-next' })); builder.onLoad({ filter: /.*/, namespace: 'test-next' }, args => ({ contents: args.path.endsWith('navigation') ? 'export const useSearchParams=()=>new URLSearchParams();' : `import React from 'react';export default function Link(props){return React.createElement('a',props);}`, resolveDir: process.cwd(), loader: 'js' })); } }] });
const css = (await postcss([tailwind()]).process(await readFile('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' })).css;
const server = createServer((req, res) => {
  if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text); }
  else if (req.url === '/style.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<html><head><link rel="stylesheet" href="/style.css"></head><body style="--font-montserrat: Montserrat"><div id="root" class="p-6"></div><script src="/bundle.js"></script></body></html>'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
let current = null; const mutations = [];
const legacyInvitation = { id: 'invitation', status: 'PENDING', recipientName: 'Ana', recipientEmail: 'ana@example.test', expiresAt: '2099-12-03T12:00:00.000Z', sentAt: '2099-12-01T12:00:00.000Z', durationMinutes: 30, mode: 'IN_PERSON', location: 'Koru', message: null, confirmationEmailFailed: false, slots: [{ id: 'slot-0', startsAt: '2099-12-05T16:00:00.000Z', endsAt: '2099-12-05T16:30:00.000Z' }], selectedSlotId: null };
const nativeInvitation = invitation => ({ ...invitation, provider: 'GOOGLE_CALENDAR', googleEventUrl: 'https://calendar.google.com/calendar/event?eid=abc123', googleRsvpStatus: 'needsAction', googleSyncPending: false, canManageGoogle: true });
try {
  await page.route('**/api/**', async route => {
    const req = route.request(); const url = req.url(); const body = req.method() === 'POST' ? req.postDataJSON() : null;
    if (body) mutations.push(body);
    if (!url.includes('appointments')) return route.fulfill({ json: { item: { id: 'inquiry', source: 'admission', name: 'Ana Pérez', email: 'ana@example.test', status: 'NEW', receivedAt: '2026-12-01T00:00:00Z', questionnaireVersion: 'unknown' } } });
    if (url.includes('/public/appointments/')) return route.fulfill({ json: { invitation: current } });
    if (body?.startsAt) current = nativeInvitation({ id: 'invitation', status: 'PENDING', recipientName: 'Ana', recipientEmail: 'ana@example.test', expiresAt: null, sentAt: null, durationMinutes: body.durationMinutes, mode: body.mode, location: body.location, message: null, confirmationEmailFailed: false, slots: body.startsAt.map((startsAt, i) => ({ id: `slot-${i}`, startsAt, endsAt: new Date(new Date(startsAt).getTime() + body.durationMinutes * 60000).toISOString() })), selectedSlotId: null });
    if (body?.action === 'sync') current = { ...current, googleRsvpStatus: 'tentative' };
    if (body?.action === 'cancel') current = { ...current, status: 'CANCELLED', googleRsvpStatus: 'declined' };
    return route.fulfill({ json: { invitation: current, googleCalendar: { connected: true } } });
  });
  await page.goto(base); await page.evaluate(() => window.mount());
  const heading = page.getByRole('heading', { name: 'Detalle del contacto', exact: true });
  const button = page.getByRole('button', { name: 'Agendar cita', exact: true }); await button.waitFor();
  const hb = await heading.boundingBox(), bb = await button.boundingBox();
  assert.ok(bb.x > hb.x + hb.width); assert.ok(Math.abs((bb.y + bb.height / 2) - (hb.y + hb.height / 2)) < 3, 'button shares heading center line');
  await button.click(); await page.getByRole('dialog').waitFor();
  const dialog = page.getByRole('dialog');
  assert.doesNotMatch(await dialog.innerText(), /Zona horaria|Ciudad de México|America\/Mexico_City|48 horas|tiempo real|webhook/i);
  assert.match(await dialog.innerText(), /Enviar invitación de Google Calendar/);
  assert.match(await dialog.innerText(), /Organizador/);
  for (const element of [dialog, dialog.getByRole('heading'), page.getByLabel('Fecha de la cita', { exact: true })]) {
    assert.match(await element.evaluate(node => getComputedStyle(node).fontFamily), /Montserrat/, 'Montserrat inherits through dialog portal and controls');
  }
  assert.equal(await page.getByRole('button', { name: 'Agregar otro horario', exact: true }).count(), 0, 'no add-more control');
  await page.getByLabel('Lugar o enlace', { exact: true }).fill('Koru');
  await page.getByLabel('Fecha de la cita', { exact: true }).fill('2099-12-05'); await page.getByLabel('Hora de la cita', { exact: true }).fill('10:00');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const rows = await dialog.locator('fieldset').all(); assert.equal(rows.length, 1, 'exactly one date/time row');
    for (const row of rows) {
      const box = await row.boundingBox(); assert.ok(box.height <= 56, 'slot fits in a compact single row');
      assert.ok(await row.evaluate(node => node.scrollWidth <= node.clientWidth), 'slot has no internal horizontal overflow');
    }
    assert.ok(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth), 'dialog has no horizontal overflow');
    await mkdir('.tmp-appointments-e2e/evidence', { recursive: true });
    await page.screenshot({ path: `.tmp-appointments-e2e/evidence/compact-slot-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Revisar invitación', exact: true }).click(); assert.equal(mutations.length, 0);
  await page.getByRole('button', { name: 'Enviar invitación de Google Calendar', exact: true }).click();
  await page.getByText('Pendiente de respuesta', { exact: true }).waitFor(); assert.equal(mutations.length, 1);
  assert.equal(mutations[0].startsAt.length, 1, 'a single native slot is sent');
  assert.deepEqual(mutations[0].startsAt, ['2099-12-05T16:00:00.000Z']);
  assert.equal(await page.getByText('Enviada', { exact: true }).count(), 0);
  const link = page.getByRole('link', { name: 'Ver el evento en Google Calendar', exact: true });
  assert.equal(await link.getAttribute('href'), 'https://calendar.google.com/calendar/event?eid=abc123');
  assert.equal(await link.getAttribute('target'), '_blank'); assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
  await mkdir('.tmp-appointments-e2e/evidence', { recursive: true }); await page.screenshot({ path: '.tmp-appointments-e2e/evidence/admin.png', fullPage: true });
  await page.getByRole('button', { name: 'Actualizar respuesta', exact: true }).click();
  await page.getByText('Confirmación tentativa', { exact: true }).first().waitFor();
  assert.deepEqual(mutations[1], { action: 'sync' });
  await page.getByRole('button', { name: 'Cancelar cita', exact: true }).click();
  await page.getByText('Cancelada', { exact: true }).first().waitFor();
  assert.deepEqual(mutations[2], { action: 'cancel' });
  assert.equal(await page.getByRole('button', { name: 'Reenviar invitación', exact: true }).count(), 0, 'native invitations never offer the legacy resend');
  const family = await context.newPage(); current = legacyInvitation;
  await family.route('**/api/**', async route => {
    const req = route.request(); const body = req.method() === 'POST' ? req.postDataJSON() : null;
    if (body) { mutations.push(body); current = { ...legacyInvitation, status: 'CONFIRMED', selectedSlotId: body.slotId }; }
    await route.fulfill({ json: { invitation: current } });
  });
  family.on('pageerror', error => errors.push(error.message)); await family.goto(base); await family.evaluate(() => window.mount(true));
  assert.doesNotMatch(await family.locator('main').innerText(), /Zona horaria|Ciudad de México|America\/Mexico_City/);
  assert.match(await family.locator('main').evaluate(node => getComputedStyle(node).fontFamily), /Montserrat/);
  await family.getByRole('radio').first().check(); await family.getByRole('button', { name: 'Confirmar cita', exact: true }).click();
  await family.getByRole('heading', { name: 'Cita confirmada', exact: true }).waitFor();
  assert.deepEqual(mutations[3], { action: 'confirm', slotId: 'slot-0' });
  await family.screenshot({ path: '.tmp-appointments-e2e/evidence/family.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'mobile layout has no horizontal overflow');
  assert.deepEqual(errors, []);
  await writeFile('.tmp-appointments-e2e/evidence/browser.json', JSON.stringify({ passed: true, nativeSingleSlotReviewAndSend: true, nativeRsvpRefreshAndCancel: true, legacyFamilyConfirmation: true, headerAligned: true, mobileNoOverflow: true, isolatedApi: true }, null, 2));
  console.log('PASS real Chromium/React: aligned header button, modal review before one-slot native Google invitation, organizer refresh and cancel with tentative/cancelled labels, safe Google event link, Montserrat and no timezone or 48h copy, legacy family confirmation intact, mobile no overflow, no page errors. API/auth/mail/Calendar isolated.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
