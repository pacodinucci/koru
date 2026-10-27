# Private event guest selection

When an event uses private visibility and the **Privado** audience, select **Seleccionar invitados** to open the guest picker.

- The left container lists available users. **Agregar →** moves a user into the invitation selection on the right.
- The right container lists selected users. Search by name or role using **Buscar entre los invitados**. Searching does not remove or change selections.
- **← Quitar** moves a selected user back to the available list.
- **Aplicar selección** confirms the changes in the event form. **Cancelar**, the close button or dismissal discards unconfirmed changes.
- Save the event separately to persist the confirmed selection. Opening or applying the picker does not save the event or send emails.

The containers appear side by side on desktop and stack on mobile. The existing `privateAudienceUserIds` submission fields, date/time policy and email opt-in remain unchanged.

Run `node --test tests/integration/calendar-mexico-policy.test.mjs` for rendered layout, existing selection, empty-state, time policy and email opt-in checks. Dialog primitives are mocked in this suite; browser interaction and focus behavior require a separate visual check.
