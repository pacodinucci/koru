# Private event guest selection

When an event uses private visibility and the **Privado** audience, select **Seleccionar invitados** to open the guest picker.

- The left container lists available users. Search by name or role using the compact, full-width input with a magnifying-glass icon and no visible label or padding. Its accessible name is **Buscar personas disponibles**. The arrow icon button moves a user into the invitation selection on the right; its accessible label is **Agregar a [name]**.
- The right container lists selected users. Searching the available list does not hide, remove or change selections.
- The left-arrow icon button moves a selected user back to the available list; its accessible label is **Quitar a [name]**. Both lists use full-width, padding-free rows with a 32px base height matching the search input and 32px arrow buttons. Long names can wrap without being clipped.
- **Aplicar selección** confirms the changes in the event form. **Cancelar**, the close button or dismissal discards unconfirmed changes.
- Save the event separately to persist the confirmed selection. Opening or applying the picker does not save the event or send emails.

The containers appear side by side on desktop and stack on mobile. The existing `privateAudienceUserIds` submission fields, date/time policy and email opt-in remain unchanged.

Run `node --test tests/integration/calendar-mexico-policy.test.mjs` for rendered layout, existing selection, empty-state, time policy and email opt-in checks. Dialog primitives are mocked in this suite; browser interaction and focus behavior require a separate visual check.
