import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

function fixture() {
  const calls = []; const loadedModule = { exports: {} }; let status = 'sent';
  vm.runInNewContext(ts.transpileModule(readFileSync('src/modules/appointments/server/appointments.mail.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module: loadedModule, exports: loadedModule.exports, Date, URL, require: name => {
    if (name === 'server-only') return {};
    if (name === 'react') return React;
    if (name === 'react/jsx-runtime') return jsx;
    if (name === '@prisma/client') return { EmailMessageType: { MANUAL: 'MANUAL' } };
    if (name === '@react-email/components') return Object.fromEntries(['Html', 'Head', 'Preview', 'Body', 'Container', 'Heading', 'Text', 'Button'].map(key => [key, key === 'Button' ? 'a' : 'div']));
    if (name === '@/lib/env') return { env: { APP_URL: 'https://koru.example.test' } };
    if (name === '@/modules/mailing/server/mailing.service') return { sendMail: async input => { calls.push(input); return { status }; } };
    throw new Error(name);
  } });
  return { api: loadedModule.exports, calls, fail: () => { status = 'failed'; } };
}
const record = { id: 'visit-id', admissionId: 'contact', recipientName: 'Ana Familia', recipientEmail: 'family@example.test', initiatorEmail: 'admin@example.test', slots: [{ id: 'slot', startsAt: '2099-01-10T16:00:00Z' }], selectedSlotId: 'slot', durationMinutes: 30, mode: 'IN_PERSON', location: 'Sede Koru', message: 'Preguntá por admisiones.', resendCount: 0 };
test('visit email uses shared mailing sender, family only, informative copy and stable idempotency', async () => {
  const f = fixture(); assert.equal(await f.api.deliverAppointmentVisitMail(record), true);
  assert.equal(f.calls.length, 1); const mail = f.calls[0];
  assert.equal(mail.from, undefined, 'shared mailing service owns MAIL_FROM');
  assert.equal(mail.to.length, 1); assert.equal(mail.to[0].email, record.recipientEmail);
  assert.equal(mail.subject, 'Koru · Tu visita a Koru');
  assert.equal(mail.idempotencyKey, 'appointment-visit-id-visit-family');
  const html = renderToStaticMarkup(mail.react);
  for (const text of ['Gracias por completar el cuestionario inicial', 'conocer mejor a tu familia', 'resolver tus dudas sobre Koru', '30 minutos', 'presencial', 'Sede Koru', record.message, 'aceptá esa invitación', 'no reemplaza la invitación de calendario']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('/citas/')); assert.ok(!html.includes(record.initiatorEmail));
  f.fail(); assert.equal(await f.api.deliverAppointmentVisitMail(record), false);
});
test('online visit includes joining link and existing legacy mails keep audiences and personal URL', async () => {
  const f = fixture(); await f.api.deliverAppointmentVisitMail({ ...record, mode: 'ONLINE', location: 'https://meet.google.com/example' });
  const html = renderToStaticMarkup(f.calls[0].react);
  assert.ok(html.includes('online')); assert.ok(html.includes('https://meet.google.com/example'));
  await f.api.deliverAppointmentMail('invitation', record, 'personal-token');
  assert.equal(f.calls[1].to[0].email, record.recipientEmail);
  assert.ok(renderToStaticMarkup(f.calls[1].react).includes('/citas/personal-token'));
  await f.api.deliverAppointmentMail('confirmation', record, 'personal-token');
  assert.equal(f.calls[2].to[0].email, record.recipientEmail); assert.equal(f.calls[3].to[0].email, record.initiatorEmail);
});
