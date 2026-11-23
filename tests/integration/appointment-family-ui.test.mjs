import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, invitation } from './appointment-ui-harness.mjs';
const file = 'src/modules/appointments/views/appointment-family-view.tsx';
test('family page initially only reads, confirms selected slot and shows final booking on revisits', async () => {
  let current = { ...invitation }; const calls = [];
  const ui = harness(async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') current = { ...current, status: 'CONFIRMED', selectedSlotId: JSON.parse(options.body).slotId };
    return Response.json({ invitation: current });
  });
  ui.mount(file, 'AppointmentFamilyView', { token: 'opaque-token' }); await ui.flush();
  assert.equal(calls.length, 1); assert.equal(calls[0].options.method, undefined);
  assert.match(ui.text(), /Ciudad de México/); assert.match(ui.text(), /reservados hasta/);
  assert.equal(ui.button('Confirmar cita').props.disabled, true);
  const radio = ui.find(n => n.type === 'input' && n.props.type === 'radio'); radio.props.onChange(); ui.render();
  await ui.click('Confirmar cita');
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { action: 'confirm', slotId: 'slot' });
  assert.match(ui.text(), /Cita confirmada/); assert.equal(ui.button('Confirmar cita'), undefined);
  const revisit = harness(async () => Response.json({ invitation: current })); revisit.mount(file, 'AppointmentFamilyView', { token: 'opaque-token' }); await revisit.flush();
  assert.match(revisit.text(), /Cita confirmada/); assert.equal(revisit.button('Confirmar cita'), undefined);
});
test('family can reject all options and failed requests preserve selection', async () => {
  let fail = true; const calls = [];
  const ui = harness(async (_, options = {}) => {
    calls.push(options);
    if (options.method === 'POST') return Response.json(fail ? { error: 'Reintentá.' } : { invitation: { ...invitation, status: 'REJECTED' } }, { status: fail ? 503 : 200 });
    return Response.json({ invitation });
  });
  ui.mount(file, 'AppointmentFamilyView', { token: 'opaque-token' }); await ui.flush();
  ui.find(n => n.type === 'input' && n.props.type === 'radio').props.onChange(); ui.render();
  await ui.click('Confirmar cita'); assert.match(ui.text(), /Reintentá/); assert.equal(ui.find(n => n.type === 'input' && n.props.type === 'radio').props.checked, true);
  fail = false; await ui.click('Ninguno de estos horarios me sirve');
  assert.deepEqual(JSON.parse(calls.at(-1).body), { action: 'reject' }); assert.match(ui.text(), /nuevos horarios/);
});
test('expired and cancelled invitations never expose selection actions, invalid links show safe error', async () => {
  for (const status of ['EXPIRED', 'CANCELLED']) {
    const ui = harness(async () => Response.json({ invitation: { ...invitation, status } }));
    ui.mount(file, 'AppointmentFamilyView', { token: 'opaque-token' }); await ui.flush();
    assert.equal(ui.button('Confirmar cita'), undefined); assert.equal(ui.button('Ninguno de estos horarios me sirve'), undefined);
  }
  const ui = harness(async () => new Response('<html>Error</html>', { status: 404 }));
  ui.mount(file, 'AppointmentFamilyView', { token: 'opaque-token' }); await ui.flush();
  assert.match(ui.text(), /No pudimos cargar la invitación/); assert.doesNotMatch(ui.text(), /SyntaxError|<html>/);
});
