import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, invitation } from './appointment-ui-harness.mjs';
const file = 'src/modules/appointments/views/appointment-scheduler.tsx';
const props = { contactId: 'inquiry', recipientName: 'Ana', recipientEmail: 'ana@example.test', open: true, onOpenChange() {} };
test('admin reviews one to three Mexico-time options before sending; preserves input after a send error', async () => {
  const calls = []; let fail = true;
  const ui = harness(async (url, options = {}) => {
    calls.push({ url, options });
    return options.method === 'POST' ? Response.json(fail ? { error: 'No se pudo enviar.' } : { invitation }, { status: fail ? 502 : 200 }) : Response.json({ invitation: null });
  });
  ui.mount(file, 'AppointmentScheduler', props); await ui.flush();
  assert.match(ui.text(), /ana@example.test/); assert.match(ui.text(), /Ciudad de México/);
  assert.equal(ui.button('Revisar invitación').props.disabled, true);
  ui.change('Lugar o enlace', 'Koru'); ui.change('Fecha opción 1', '2099-12-05'); ui.change('Hora opción 1', '10:00');
  await ui.click('Agregar otro horario'); await ui.click('Agregar otro horario');
  assert.equal(ui.button('Agregar otro horario').props.disabled, true);
  ui.change('Fecha opción 2', '2099-12-06'); ui.change('Hora opción 2', '10:00');
  ui.change('Fecha opción 3', '2099-12-07'); ui.change('Hora opción 3', '10:00');
  await ui.click('Revisar invitación');
  assert.equal(calls.filter(c => c.options.method === 'POST').length, 0);
  await ui.click('Enviar invitación por mail'); assert.match(ui.text(), /No se pudo enviar/);
  const body = JSON.parse(calls.at(-1).options.body);
  assert.deepEqual(body.startsAt, ['2099-12-05T16:00:00.000Z', '2099-12-06T16:00:00.000Z', '2099-12-07T16:00:00.000Z']);
  await ui.click('Editar horarios');
  assert.equal(ui.find(n => n.props['aria-label'] === 'Fecha opción 1').props.value, '2099-12-05');
  fail = false; await ui.click('Revisar invitación'); await ui.click('Enviar invitación por mail');
  assert.match(ui.text(), /Pendiente de elección/);
});
test('pending invitation offers resend and cancel, confirmed appointment stays separate', async () => {
  const calls = []; const ui = harness(async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST' && JSON.parse(options.body).action === 'cancel') return Response.json({ invitation: { ...invitation, status: 'CANCELLED' } });
    return Response.json({ invitation });
  });
  ui.mount(file, 'AppointmentScheduler', { ...props, open: false }); await ui.flush();
  await ui.click('Reenviar invitación');
  assert.equal(JSON.parse(calls.at(-1).options.body).action, 'resend');
  await ui.click('Cancelar invitación'); assert.match(ui.text(), /Cancelada/);
  assert.equal(JSON.parse(calls.at(-1).options.body).action, 'cancel');
});
test('contact header exposes scheduling only for admission source and authorized management', async () => {
  for (const [source, canSchedule, canManage, expected] of [['admission', true, true, true], ['contact', true, true, false], ['admission', false, true, false], ['admission', true, false, false]]) {
    const ui = harness(async url => Response.json(url.endsWith('/appointments') ? { invitation: null } : { item: { id: 'inquiry', source, name: 'Ana', email: 'ana@example.test', status: 'NEW', receivedAt: '2099-01-01T00:00:00Z', questionnaireVersion: 'unknown' } }));
    ui.mount('src/modules/contacts/views/contact-detail.tsx', 'ContactDetail', { source, id: 'inquiry', canManage, canSchedule }); await ui.flush();
    assert.equal(!!ui.button('Agendar cita'), expected);
    assert.match(ui.text(), /Marcar Respondido solo registra el seguimiento/);
    if (expected) { const row = ui.find(n => n.props.className?.includes('justify-between') && ui.text(n).includes('Detalle del contacto')); assert.ok(row); assert.match(row.props.className, /items-center/); }
  }
});
