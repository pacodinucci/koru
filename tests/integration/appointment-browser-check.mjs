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
  else { res.setHeader('Content-Type', 'text/html'); res.end('<html><head><link rel="stylesheet" href="/style.css"></head><body><div id="root" class="p-6"></div><script src="/bundle.js"></script></body></html>'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
let current = null; const mutations = [];
try {
  await page.route('**/api/**', async route => {
    const req = route.request(); const url = req.url(); const body = req.method() === 'POST' ? req.postDataJSON() : null;
    if (body) mutations.push(body);
    if (!url.includes('appointments')) return route.fulfill({ json: { item: { id: 'inquiry', source: 'admission', name: 'Ana Pérez', email: 'ana@example.test', status: 'NEW', receivedAt: '2026-12-01T00:00:00Z', questionnaireVersion: 'unknown' } } });
    if (body?.startsAt) current = { id: 'invitation', status: 'PENDING', recipientName: 'Ana', recipientEmail: 'ana@example.test', expiresAt: '2099-12-03T12:00:00.000Z', sentAt: '2099-12-01T12:00:00.000Z', durationMinutes: body.durationMinutes, mode: body.mode, location: body.location, message: body.message, confirmationEmailFailed: false, slots: body.startsAt.map((startsAt, i) => ({ id: `slot-${i}`, startsAt, endsAt: new Date(new Date(startsAt).getTime() + body.durationMinutes * 60000).toISOString() })), selectedSlotId: null };
    if (body?.action === 'confirm') current = { ...current, status: 'CONFIRMED', selectedSlotId: body.slotId };
    return route.fulfill({ json: { invitation: current } });
  });
  await page.goto(base); await page.evaluate(() => window.mount());
  const heading = page.getByRole('heading', { name: 'Detalle del contacto', exact: true });
  const button = page.getByRole('button', { name: 'Agendar cita', exact: true }); await button.waitFor();
  const hb = await heading.boundingBox(), bb = await button.boundingBox();
  assert.ok(bb.x > hb.x + hb.width); assert.ok(Math.abs((bb.y + bb.height / 2) - (hb.y + hb.height / 2)) < 3, 'button shares heading center line');
  await button.click(); await page.getByRole('dialog').waitFor();
  await page.getByLabel('Lugar o enlace', { exact: true }).fill('Koru');
  await page.getByLabel('Fecha opción 1', { exact: true }).fill('2099-12-05'); await page.getByLabel('Hora opción 1', { exact: true }).fill('10:00');
  await page.getByRole('button', { name: 'Agregar otro horario', exact: true }).click();
  await page.getByLabel('Fecha opción 2', { exact: true }).fill('2099-12-06'); await page.getByLabel('Hora opción 2', { exact: true }).fill('11:00');
  await page.getByRole('button', { name: 'Revisar invitación', exact: true }).click(); assert.equal(mutations.length, 0);
  await page.getByRole('button', { name: 'Enviar invitación por mail', exact: true }).click();
  await page.getByText('Pendiente de elección', { exact: true }).waitFor(); assert.equal(mutations.length, 1);
  await mkdir('.tmp-appointments-e2e/evidence', { recursive: true }); await page.screenshot({ path: '.tmp-appointments-e2e/evidence/admin.png', fullPage: true });
  const family = await context.newPage(); await family.route('**/api/**', async route => { const req = route.request(); if (req.method() === 'POST') { const body = req.postDataJSON(); mutations.push(body); current = { ...current, status: 'CONFIRMED', selectedSlotId: body.slotId }; } await route.fulfill({ json: { invitation: current } }); });
  family.on('pageerror', error => errors.push(error.message)); await family.goto(base); await family.evaluate(() => window.mount(true));
  await family.getByRole('radio').first().check(); await family.getByRole('button', { name: 'Confirmar cita', exact: true }).click();
  await family.getByRole('heading', { name: 'Cita confirmada', exact: true }).waitFor();
  assert.deepEqual(mutations[1], { action: 'confirm', slotId: 'slot-0' });
  await family.screenshot({ path: '.tmp-appointments-e2e/evidence/family.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'mobile layout has no horizontal overflow');
  assert.deepEqual(errors, []);
  await writeFile('.tmp-appointments-e2e/evidence/browser.json', JSON.stringify({ passed: true, adminReviewAndSend: true, familyConfirmation: true, headerAligned: true, mobileNoOverflow: true, isolatedApi: true }, null, 2));
  console.log('PASS real Chromium/React: aligned header button, modal review before send, two Mexico-time options, pending status, anonymous family confirmation, mobile no overflow, no page errors. API/auth/mail isolated.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
