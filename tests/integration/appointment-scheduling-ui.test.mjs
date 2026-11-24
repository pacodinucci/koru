import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, invitation } from './appointment-ui-harness.mjs';
const file = 'src/modules/appointments/views/appointment-scheduler.tsx';
const props = { contactId: 'inquiry', recipientName: 'Ana', recipientEmail: 'ana@example.test', open: true, onOpenChange() {} };
const google = (overrides = {}) => ({ ...invitation, provider: 'GOOGLE_CALENDAR', googleEventUrl: 'https://calendar.google.com/calendar/event?eid=abc', googleRsvpStatus: 'needsAction', googleSyncPending: false, canManageGoogle: true, ...overrides });
const eventLink = ui => ui.nodes().find(n => n.type === 'a' && typeof n.props.href === 'string' && n.props.href.startsWith('https://'));

test('admin sends exactly one native Google Calendar invitation after review; failure keeps the chosen slot', async () => {
  const calls = []; let fail = true;
  const ui = harness(async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') return Response.json(fail ? { error: 'No se pudo enviar.' } : { invitation: google() }, { status: fail ? 502 : 200 });
    return Response.json({ invitation: null, googleCalendar: { connected: true } });
  });
  ui.mount(file, 'AppointmentScheduler', props); await ui.flush();
  assert.match(ui.text(), /ana@example\.test/);
  assert.match(ui.text(), /Enviar invitación de Google Calendar/);
  assert.match(ui.text(), /Organizador/);
  assert.match(ui.text(), /responde desde el correo de Google Calendar/);
  assert.match(ui.text(), /También recibe un correo de Koru con los detalles de la visita/);
  assert.doesNotMatch(ui.text(), /Zona horaria|Ciudad de México|America\/Mexico_City|48 horas|tiempo real|webhook/i);
  assert.ok(ui.find(n => n.props.className?.includes('font-montserrat') && ui.text(n).includes('Agendar cita')), 'dialog explicitly uses Montserrat, including its portal');
  assert.equal(ui.button('Agregar otro horario'), undefined);
  assert.equal(ui.button('Quitar opción 1'), undefined);
  const rows = ui.nodes().filter(n => n.type === 'fieldset');
  assert.equal(rows.length, 1, 'exactly one date/time row');
  assert.match(rows[0].props.className, /grid/); assert.match(rows[0].props.className, /items-center/); assert.doesNotMatch(rows[0].props.className, /p-3|space-y/);
  assert.equal(ui.button('Revisar invitación').props.disabled, true);
  ui.change('Lugar o enlace', 'Koru'); ui.change('Fecha de la cita', '2099-12-05'); ui.change('Hora de la cita', '10:00');
  await ui.click('Revisar invitación');
  assert.equal(calls.filter(c => c.options.method === 'POST').length, 0, 'review never sends');
  await ui.click('Enviar invitación de Google Calendar'); assert.match(ui.text(), /No se pudo enviar/);
  const body = JSON.parse(calls.at(-1).options.body);
  assert.equal(body.startsAt.length, 1);
  assert.deepEqual(body.startsAt, ['2099-12-05T16:00:00.000Z'], 'one Mexico-time slot converted internally');
  await ui.click('Editar horario');
  assert.equal(ui.find(n => n.props['aria-label'] === 'Fecha de la cita').props.value, '2099-12-05');
  assert.equal(ui.find(n => n.props['aria-label'] === 'Hora de la cita').props.value, '10:00');
  assert.equal(ui.find(n => n.props['aria-label'] === 'Lugar o enlace').props.value, 'Koru');
  fail = false; await ui.click('Revisar invitación'); await ui.click('Enviar invitación de Google Calendar');
  assert.match(ui.text(), /Pendiente de respuesta/);
  assert.ok(ui.button('Actualizar respuesta'));
  assert.equal(ui.button('Reenviar invitación'), undefined);
});

test('disconnected Google Calendar blocks sending and points to the project connection settings', async () => {
  const calls = [];
  const ui = harness(async (url, options = {}) => { calls.push({ url, options }); return Response.json({ invitation: null, googleCalendar: { connected: false } }); });
  ui.mount(file, 'AppointmentScheduler', props); await ui.flush();
  assert.match(ui.text(), /Conectá tu cuenta de Google Calendar/);
  const link = ui.find(n => n.type === 'a' && ui.text(n) === 'Conectar Google Calendar');
  assert.ok(link, 'connection link rendered'); assert.equal(link.props.href, '/calendario');
  ui.change('Lugar o enlace', 'Koru'); ui.change('Fecha de la cita', '2099-12-05'); ui.change('Hora de la cita', '10:00');
  await ui.click('Revisar invitación');
  assert.equal(ui.button('Enviar invitación de Google Calendar').props.disabled, true);
  assert.equal(calls.filter(c => c.options.method === 'POST').length, 0);
});

test('native appointment shows the last observed RSVP with organizer refresh and cancel, never legacy resend', async () => {
  for (const [rsvp, status, label] of [['needsAction', 'PENDING', /Pendiente de respuesta/], ['tentative', 'PENDING', /Confirmación tentativa/], ['accepted', 'CONFIRMED', /Cita confirmada/]]) {
    const calls = [];
    const synced = google({ googleRsvpStatus: 'tentative' });
    const ui = harness(async (url, options = {}) => {
      calls.push({ url, options });
      if (options.method === 'POST') return Response.json({ invitation: JSON.parse(options.body).action === 'cancel' ? google({ status: 'CANCELLED', googleRsvpStatus: 'accepted' }) : synced });
      return Response.json({ invitation: google({ googleRsvpStatus: rsvp, status, selectedSlotId: status === 'CONFIRMED' ? 'slot' : null }), googleCalendar: { connected: true } });
    });
    ui.mount(file, 'AppointmentScheduler', { ...props, open: false }); await ui.flush();
    assert.match(ui.text(), label);
    assert.match(ui.text(), /Última respuesta observada/);
    assert.equal(ui.button('Reenviar invitación'), undefined); assert.equal(ui.button('Reenviar confirmación'), undefined);
    const anchor = eventLink(ui);
    assert.ok(anchor, 'google event link rendered'); assert.equal(anchor.props.target, '_blank');
    assert.match(anchor.props.rel, /noopener/); assert.match(anchor.props.rel, /noreferrer/);
    assert.doesNotMatch(ui.text(), /Zona horaria|Ciudad de México|48 horas/);
    await ui.click('Actualizar respuesta');
    assert.deepEqual(JSON.parse(calls.at(-1).options.body), { action: 'sync' });
    await ui.click('Cancelar cita');
    assert.equal(JSON.parse(calls.at(-1).options.body).action, 'cancel');
    assert.match(ui.text(), /Cancelada/);
  }
});

test('unresolved native state warns and allows refresh instead of claiming it was sent', async () => {
  const ui = harness(async () => Response.json({ invitation: google({ googleRsvpStatus: null, googleSyncPending: true }), googleCalendar: { connected: true } }));
  ui.mount(file, 'AppointmentScheduler', { ...props, open: false }); await ui.flush();
  assert.match(ui.text(), /Todavía no registramos|todavía no confirmó/);
  assert.doesNotMatch(ui.text(), /Enviada|Enviado/, 'no false sent state while unresolved');
  assert.ok(ui.button('Actualizar respuesta'), 'refresh stays available');
});

test('a past native appointment does not block scheduling the next one', async () => {
  const ui = harness(async () => Response.json({ invitation: google({ status: 'PENDING', slots: [{ id: 'past', startsAt: '2020-01-01T10:00:00.000Z', endsAt: '2020-01-01T10:30:00.000Z' }] }), googleCalendar: { connected: true } }));
  ui.mount(file, 'AppointmentScheduler', props); await ui.flush();
  assert.ok(ui.find(n => n.props['aria-label'] === 'Fecha de la cita'));
  assert.doesNotMatch(ui.text(), /ya tiene una invitación o cita activa/);
});

test('native mutations stay with the organizing admin', async () => {
  const ui = harness(async () => Response.json({ invitation: google({ canManageGoogle: false }), googleCalendar: { connected: true } }));
  ui.mount(file, 'AppointmentScheduler', { ...props, open: false }); await ui.flush();
  assert.match(ui.text(), /Solo el administrador que envió la invitación/);
  assert.equal(ui.button('Actualizar respuesta'), undefined);
  assert.equal(ui.button('Cancelar cita'), undefined);
  assert.match(ui.text(), /Pendiente de respuesta/);
});

test('google event links render only for trusted Google Calendar https URLs', async () => {
  for (const [url, expected] of [
    ['https://calendar.google.com/calendar/event?eid=abc', true],
    ['https://www.google.com/calendar/event?eid=abc', true],
    ['http://calendar.google.com/calendar/event?eid=abc', false],
    ['https://calendar.google.com.evil.test/calendar', false],
    ['https://evil.test/?next=https://calendar.google.com/', false],
    ['https://www.google.com/other?eid=abc', false],
    ['javascript:alert(1)', false],
    [null, false],
  ]) {
    const ui = harness(async () => Response.json({ invitation: google({ googleEventUrl: url }), googleCalendar: { connected: true } }));
    ui.mount(file, 'AppointmentScheduler', { ...props, open: false }); await ui.flush();
    assert.equal(!!eventLink(ui), expected, `${url}`);
  }
});

test('legacy emailed invitations keep resend, cancel, status and the 48 hour reservation copy', async () => {
  const calls = []; let current = { ...invitation }; let fail = true;
  const ui = harness(async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') {
      if (fail) return Response.json({ error: 'Reintentá.' }, { status: 503 });
      current = JSON.parse(options.body).action === 'cancel' ? { ...current, status: 'CANCELLED' } : current;
    }
    return Response.json({ invitation: current, googleCalendar: { connected: false } });
  });
  ui.mount(file, 'AppointmentScheduler', { ...props, open: false }); await ui.flush();
  assert.match(ui.text(), /Pendiente de elección/);
  assert.match(ui.text(), /48 horas/);
  assert.ok(ui.button('Reenviar invitación')); assert.ok(ui.button('Cancelar invitación'));
  assert.equal(ui.button('Actualizar respuesta'), undefined);
  await ui.click('Reenviar invitación');
  assert.equal(JSON.parse(calls.at(-1).options.body).action, 'resend'); assert.match(ui.text(), /Reintentá/);
  fail = false;
  await ui.click('Reenviar invitación');
  assert.ok(calls.at(-1).url.endsWith('/appointments/invitation'), 'legacy actions stay on the invitation item route');
  await ui.click('Cancelar invitación'); assert.match(ui.text(), /Cancelada/);
  assert.equal(JSON.parse(calls.at(-1).options.body).action, 'cancel');
});

test('legacy confirmed invitation keeps its resend confirmation action', async () => {
  const calls = [];
  const ui = harness(async (url, options = {}) => {
    calls.push({ url, options });
    return Response.json({ invitation: { ...invitation, status: 'CONFIRMED', selectedSlotId: 'slot' }, googleCalendar: { connected: true } });
  });
  ui.mount(file, 'AppointmentScheduler', { ...props, open: false }); await ui.flush();
  assert.match(ui.text(), /Cita confirmada/);
  await ui.click('Reenviar confirmación');
  assert.equal(JSON.parse(calls.at(-1).options.body).action, 'resend');
  assert.equal(ui.button('Actualizar respuesta'), undefined);
});

test('contact header exposes scheduling only for admission source and authorized management', async () => {
  for (const [source, canSchedule, canManage, expected] of [['admission', true, true, true], ['contact', true, true, false], ['admission', false, true, false], ['admission', true, false, false]]) {
    const ui = harness(async url => Response.json(url.endsWith('/appointments') ? { invitation: null, googleCalendar: { connected: true } } : { item: { id: 'inquiry', source, name: 'Ana', email: 'ana@example.test', status: 'NEW', receivedAt: '2099-01-01T00:00:00Z', questionnaireVersion: 'unknown' } }));
    ui.mount('src/modules/contacts/views/contact-detail.tsx', 'ContactDetail', { source, id: 'inquiry', canManage, canSchedule }); await ui.flush();
    assert.equal(!!ui.button('Agendar cita'), expected);
    assert.match(ui.text(), /Marcar Respondido solo registra el seguimiento/);
    if (expected) { const row = ui.find(n => n.props.className?.includes('justify-between') && ui.text(n).includes('Detalle del contacto')); assert.ok(row); assert.match(row.props.className, /items-center/); }
  }
});
