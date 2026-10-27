import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const permission = 'calendar.permissions.manage';
const pagePath = 'src/app/(dashboard)/dashboard/calendar-permissions/page.tsx';
function load(path, mocks = {}) {
  const output = ts.transpileModule(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { FormData, module: mod, exports: mod.exports, require: id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('react')) return require(id);
    throw new Error(`Unexpected dependency ${id}`);
  } });
  return mod.exports;
}
function fixture(keys) {
  const state = { checks: [], reads: 0, writes: [], deferred: [], revalidated: [] };
  const actor = { email: 'staff@example.test', role: 'TEACHER', permissionKeys: keys };
  const mocks = {
    '@/modules/auth/server/auth-guards': { requirePermission: async key => {
      state.checks.push(key);
      if (!keys.includes(key)) throw new Error('forbidden');
      return actor;
    } },
    '@/lib/prisma': { prisma: { user: { findMany: async () => { state.reads++; return []; } } } },
    '@/modules/calendar/server/calendar-areas.repository': {
      calendarInternalRoles: ['TEACHER'],
      listCalendarAreas: async () => { state.reads++; return []; },
      setCalendarAreaGrant: async input => { state.writes.push(input); },
    },
    '@/modules/calendar/components/calendar-area-access-manager': { CalendarAreaAccessManager: () => React.createElement('div', null, 'Area access manager') },
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/cache': { revalidatePath: path => state.revalidated.push(path) },
    'next/server': { after: work => state.deferred.push(work) },
    '@/modules/calendar/server/google-calendar/google-calendar-sync.service': { syncUpcomingConfirmedEventsForUser: async () => {} },
  };
  return { state, mocks };
}

test('permission is assignable in Roles independently of event management', () => {
  const { permissionCatalog, legacyRolePermissions } = load('src/modules/auth/permissions/permission-catalog.ts');
  assert.equal(permissionCatalog.filter(p => p.key === permission).length, 1);
  assert.equal(permissionCatalog.find(p => p.key === permission).section, 'Permisos del calendario');
  assert.ok(legacyRolePermissions.SUPERADMIN.includes(permission));
  assert.ok(legacyRolePermissions.ADMIN.includes(permission));
  for (const role of ['TEACHER', 'ADMIN_TEACHER', 'ADMIN_OPERATOR', 'PSYCHOPEDAGOGY_TEACHER', 'PARENT']) {
    assert.equal(legacyRolePermissions[role].includes(permission), false);
  }
  assert.ok(legacyRolePermissions.TEACHER.includes('calendar.view'));
});

test('administration view rejects event managers without its dedicated permission before reading users or grants', async () => {
  const { mocks, state } = fixture(['calendar.manage']);
  const { CalendarAreasAdminView } = load('src/modules/calendar/views/calendar-areas-admin-view.tsx', mocks);
  await assert.rejects(CalendarAreasAdminView(), { message: 'forbidden' });
  assert.deepEqual(state, { checks: [permission], reads: 0, writes: [], deferred: [], revalidated: [] });
});

test('dedicated permission allows viewing assignments without calendar.manage', async () => {
  const { mocks, state } = fixture([permission]);
  const { CalendarAreasAdminView } = load('src/modules/calendar/views/calendar-areas-admin-view.tsx', mocks);
  const html = renderToStaticMarkup(await CalendarAreasAdminView());
  assert.match(html, /Permisos del calendario/);
  assert.match(html, /Area access manager/);
  assert.doesNotMatch(html, /Volver al calendario/);
  assert.deepEqual(state.checks, [permission]);
  assert.equal(state.reads, 2);
});

test('grant action rejects unauthorized and malformed requests with no mutations or scheduled effects', async () => {
  for (const [keys, level, message] of [[['calendar.manage'], 'edit', 'forbidden'], [[permission], 'invalid', 'invalid_calendar_area_grant']]) {
    const { mocks, state } = fixture(keys);
    const { setCalendarAreaGrantAction } = load('src/modules/calendar/server/calendar-areas.actions.ts', mocks);
    const form = new FormData();
    form.set('areaId', 'academic'); form.set('userId', 'teacher'); form.set('accessLevel', level);
    await assert.rejects(setCalendarAreaGrantAction(form), { message });
    assert.deepEqual(state, { checks: [permission], reads: 0, writes: [], deferred: [], revalidated: [] });
  }
});

test('grant action retains none/read/edit behavior with the new permission and revalidates both screens', async () => {
  for (const level of ['none', 'read', 'edit']) {
    const { mocks, state } = fixture([permission]);
    const { setCalendarAreaGrantAction } = load('src/modules/calendar/server/calendar-areas.actions.ts', mocks);
    const form = new FormData();
    form.set('areaId', 'academic'); form.set('userId', 'teacher'); form.set('accessLevel', level);
    assert.equal(await setCalendarAreaGrantAction(form), undefined);
    assert.deepEqual(JSON.parse(JSON.stringify(state.writes)), [{ areaId: 'academic', userId: 'teacher', enabled: level !== 'none', canEdit: level === 'edit' }]);
    assert.deepEqual(state.checks, [permission]);
    assert.equal(state.deferred.length, 1);
    assert.ok(state.revalidated.includes('/dashboard/calendar-permissions'));
    assert.ok(state.revalidated.includes('/dashboard/calendar'));
  }
});

test('new System page uses the dashboard shell and checks permission before rendering', async () => {
  for (const keys of [[], [permission]]) {
    const { mocks, state } = fixture(keys);
    const Page = load(pagePath, {
      ...mocks,
      '@/modules/dashboard/components/dashboard-shell': { DashboardShell: ({ children, breadcrumbPage, userPermissions }) => React.createElement('main', { 'data-breadcrumb': breadcrumbPage, 'data-permissions': userPermissions.join(',') }, children) },
      '@/modules/calendar/views/calendar-areas-admin-view': { CalendarAreasAdminView: () => React.createElement('div', null, 'Assignments') },
    }).default;
    if (!keys.length) await assert.rejects(Page(), { message: 'forbidden' });
    else {
      const html = renderToStaticMarkup(await Page());
      assert.match(html, /data-breadcrumb="Permisos del calendario"/);
      assert.match(html, /Assignments/);
      assert.match(html, /data-permissions="calendar.permissions.manage"/);
    }
    assert.deepEqual(state.checks, [permission]);
    assert.equal(state.reads, 0);
  }
});

test('old address redirects only after checking the dedicated permission', async () => {
  for (const keys of [[], [permission]]) {
    const { mocks, state } = fixture(keys);
    const redirects = [];
    const Page = load('src/app/(dashboard)/dashboard/calendar/areas/page.tsx', {
      ...mocks, 'next/navigation': { redirect: path => { redirects.push(path); throw new Error('redirect'); } },
    }).default;
    await assert.rejects(Page(), { message: keys.length ? 'redirect' : 'forbidden' });
    assert.deepEqual(state.checks, [permission]);
    assert.deepEqual(redirects, keys.length ? ['/dashboard/calendar-permissions'] : []);
  }
});
