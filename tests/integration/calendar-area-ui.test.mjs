import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { createElement, cloneElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const passthrough = ({ children, render }) => render ? cloneElement(render, {}, children) : createElement('div', null, children);
function load(path, extra = {}) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  const mocks = {
    '@/components/ui/responsive-dialog': { ResponsiveDialogClose: passthrough },
    '@/modules/dashboard/components/responsive-event-sheet': { ResponsiveEventSheet: passthrough },
    '@/modules/dashboard/components/calendar-event-image-field': { CalendarEventImageField: () => null },
    '@/modules/dashboard/components/calendar-event-attendance-dialog': { CalendarEventAttendanceDialog: () => null },
    './calendar-event-guest-picker': { CalendarEventGuestPicker: () => createElement('span', null, 'Guest picker') },
    '@/modules/dashboard/server/calendar.actions': { cancelCalendarEventAction: async () => {} },
    'next/link': { default: ({ children, href }) => createElement('a', { href }, children) },
    ...extra,
  };
  vm.runInNewContext(output, { URLSearchParams, module: loaded, exports: loaded.exports, require: id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('@/modules/calendar/lib/') || id === '@/modules/dashboard/lib/calendar-range') return load(`src/${id.slice(2)}.ts`);
    if (id.startsWith('react') || id === 'lucide-react') return require(id);
    throw new Error(`Unexpected dependency ${id}`);
  } });
  return loaded.exports;
}
const areas = [{ id: 'academic', name: 'Académico', color: '#2563eb' }, { id: 'operations', name: 'Operaciones', color: '#d97706' }];
const base = { id: 'meeting', title: 'Private family meeting', description: 'Authorized content', startsAt: new Date('2026-10-01T15:00:00Z'), endsAt: new Date('2026-10-01T16:00:00Z'), timeZone: 'America/Mexico_City', visibility: 'MEMBERS', audienceType: 'PRIVATE', kind: 'MEETING', accessScope: 'PEOPLE', responsibleAreaId: 'academic', areaLinks: [{ areaId: 'academic', area: areas[0] }], audiences: [{ userId: 'organizer' }] };

test('area filters keep one shared event, use union semantics and preserve authorized legacy events without filters', () => {
  const { filterCalendarEventsByAreas } = load('src/modules/calendar/lib/calendar-area-types.ts');
  const shared = { id: 'shared', areaLinks: [{ areaId: 'academic' }, { areaId: 'operations' }] };
  const legacy = { id: 'legacy' };
  const events = [shared, legacy];
  assert.deepEqual(Array.from(filterCalendarEventsByAreas(events, []), e => e.id), ['shared','legacy']);
  assert.deepEqual(Array.from(filterCalendarEventsByAreas(events, ['academic','operations']), e => e.id), ['shared']);
  assert.deepEqual(Array.from(filterCalendarEventsByAreas(events, ['unknown']), e => e.id), []);
});

test('new form separates involved areas, authorized areas and responsible editing area', () => {
  const { CalendarEventForm } = load('src/modules/dashboard/components/calendar-event-form.tsx');
  const html = renderToStaticMarkup(createElement(CalendarEventForm, { users: [], areas, editableAreaIds: ['academic'], currentUserId: 'organizer' }));
  assert.match(html, /name="accessScope"/);
  assert.match(html, /Áreas involucradas/);
  assert.match(html, /Áreas autorizadas para consultar/);
  assert.match(html, /name="responsibleAreaId"/);
  assert.match(html, /name="involvedAreaIds"/);
  assert.match(html, /name="audienceAreaIds"/);
  assert.match(html, /name="visibility" value="MEMBERS"/);
  assert.doesNotMatch(html, /<option value="LEGACY"/);
  assert.match(html, /Las áreas involucradas no conceden acceso/);
});

test('restricted event preserves explicit people and explains manager restriction', () => {
  const { CalendarEventForm } = load('src/modules/dashboard/components/calendar-event-form.tsx');
  const html = renderToStaticMarkup(createElement(CalendarEventForm, { users: [], areas, editableAreaIds: ['academic'], currentUserId: 'organizer', event: base }));
  assert.match(html, /name="privateAudienceUserIds" value="organizer"/);
  assert.match(html, /incluso si otras administran el calendario/);
  assert.doesNotMatch(html, /name="audienceAreaIds"/);
});

test('event managers retain event creation but access administration no longer appears in the calendar', () => {
  const { DashboardCalendarTopBar } = load('src/modules/dashboard/views/dashboard-calendar-view.tsx', { '@/modules/dashboard/components/calendar-event-form': { CalendarEventForm: () => createElement('span', null, 'CREATE_FORM') } });
  const html = renderToStaticMarkup(createElement(DashboardCalendarTopBar, { users: [], events: [], dateCursor: base.startsAt, viewMode: 'week', areas, editableAreaIds: [], canManageCalendar: true }));
  assert.match(html, /Crear evento|CREATE_FORM/);
  assert.doesNotMatch(html, /Áreas y accesos|calendar\/areas|calendar-permissions/);
});

test('consultation detail exposes no edit, cancellation or attendance actions', () => {
  const { DashboardCalendarTopBar } = load('src/modules/dashboard/views/dashboard-calendar-view.tsx', { '@/modules/dashboard/components/calendar-event-form': { CalendarEventForm: () => createElement('span', null, 'EDIT_FORM') } });
  const html = renderToStaticMarkup(createElement(DashboardCalendarTopBar, { users: [], events: [{ ...base, canEdit: false }], selectedEventId: base.id, dateCursor: base.startsAt, viewMode: 'week', areas, editableAreaIds: [], canManageCalendar: false }));
  assert.match(html, /Private family meeting/);
  assert.match(html, /acceso de consulta/);
  assert.doesNotMatch(html, /EDIT_FORM|Crear evento|Cancelar evento|Áreas y accesos/);
});
