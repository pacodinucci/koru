# Calendar invitation emails

Saving an event does not send invitation emails by default.

In **Inscripción y asistencia**, enable **Solicitar confirmación de asistencia** to make attendance invitations available. Select **Enviar invitaciones por email** to send pending invitations when saving. Leaving this checkbox unchecked saves the event and its attendance list without sending invitation emails.

The email checkbox starts unchecked when opening the create or edit form. It is a per-save choice, not a stored event preference. Both the save API and server action require an explicit `sendEmails=on` alongside attendance confirmation before scheduling invitation emails.

Manual invitations and the explicit retry action remain available and send emails independently of this checkbox. Google Calendar synchronization and Mexico City date/time handling are unchanged.

## Verification

Run `node --test tests/integration/calendar-mexico-policy.test.mjs` to check opt-in behavior through both save entry points, including unchanged attendance persistence, Google sync scheduling and Mexico City timestamps. The suite mocks persistence, mail and Google calls; it does not send real emails.
