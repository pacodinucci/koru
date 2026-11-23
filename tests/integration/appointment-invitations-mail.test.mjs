import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function setup(failEmail) {
  const sent = []; const mod = { exports: {} };
  const source = readFileSync('src/modules/appointments/server/appointments.mail.tsx', 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: mod, exports: mod.exports, Date, URL, Promise,
    require(id) {
      if (id === 'server-only') return {};
      if (id === '@/lib/env') return { env: { APP_URL: 'https://koru.example.test' } };
      if (id === '@/modules/mailing/server/mailing.service') return { sendMail: async input => { sent.push(input); return { status: input.to[0].email === failEmail ? 'failed' : 'sent' }; } };
      return require(id);
    },
  });
  const record = { id: 'invitation', admissionId: 'inquiry', recipientName: 'Ana', recipientEmail: 'family@example.test', initiatorEmail: 'admin@example.test', expiresAt: new Date('2026-12-03T12:00:00Z'), durationMinutes: 30, mode: 'IN_PERSON', location: 'Koru', message: '<script>alert(1)</script>', resendCount: 0, selectedSlotId: 'chosen', slots: [{ id: 'chosen', startsAt: '2026-12-05T16:00:00Z', endsAt: '2026-12-05T16:30:00Z' }, { id: 'other', startsAt: '2026-12-06T16:00:00Z', endsAt: '2026-12-06T16:30:00Z' }] };
  return { send: mod.exports.deliverAppointmentMail, sent, record };
}
test('invitation mail has safe personal link, expiry and all options without persisting bearer token', async () => {
  const h = setup(); const token = 'a'.repeat(43); assert.equal(await h.send('invitation', h.record, token), true);
  assert.equal(h.sent.length, 1); assert.equal(h.sent[0].to[0].email, 'family@example.test');
  assert.doesNotMatch(JSON.stringify(h.sent[0].payload), new RegExp(token)); assert.ok(!h.sent[0].idempotencyKey.includes(token));
  const html = renderToStaticMarkup(h.sent[0].react);
  assert.ok(html.includes(`/citas/${token}`)); assert.match(html, /Ciudad de México/); assert.match(html, /48 horas desde el envío exitoso/); assert.match(html, /5 de diciembre/); assert.match(html, /6 de diciembre/);
  assert.doesNotMatch(html, /<script>/); assert.match(html, /&lt;script&gt;/);
  await h.send('invitation', { ...h.record, sentAt: new Date('2026-12-01T12:00:00Z'), resendCount: 1 }, token);
  assert.match(renderToStaticMarkup(h.sent[1].react), /reservados hasta/);
});
test('confirmation goes to family and initiating admin; only chosen option appears; rejection only to admin', async () => {
  const h = setup('admin@example.test'); const token = 'b'.repeat(43);
  assert.equal(await h.send('confirmation', h.record, token), false);
  assert.deepEqual(h.sent.map(input => input.to[0].email).sort(), ['admin@example.test', 'family@example.test']);
  for (const input of h.sent) { const html = renderToStaticMarkup(input.react); assert.match(html, /5 de diciembre/); assert.doesNotMatch(html, /6 de diciembre/); assert.ok(!JSON.stringify(input.payload).includes(token)); }
  assert.match(renderToStaticMarkup(h.sent.find(input => input.to[0].email.startsWith('family')).react), /\/citas\//);
  const rejection = setup(); assert.equal(await rejection.send('rejection', rejection.record), true); assert.equal(rejection.sent.length, 1); assert.equal(rejection.sent[0].to[0].email, 'admin@example.test');
});
