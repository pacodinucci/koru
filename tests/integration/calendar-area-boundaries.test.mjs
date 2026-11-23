import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function loadAccess(users = [], grants = []) {
  const file = new URL('../../src/modules/calendar/server/calendar-access.ts', import.meta.url);
  const source = readFileSync(file, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  const mocks = {
    'server-only': {},
    '@/lib/prisma': { prisma: { user: { findUnique: async ({ where }) => users.find(u => u.id === where.id) ?? null }, calendarAreaGrant: { findMany: async ({ where }) => grants.filter(g => g.userId === where.userId) } } },
    '@/modules/calendar/lib/calendar-access': { isInternalCalendarRole: role => ['ADMIN', 'SUPERADMIN', 'ADMIN_OPERATOR', 'TEACHER', 'ADMIN_TEACHER', 'PSYCHOPEDAGOGY', 'PSYCHOPEDAGOGY_TEACHER'].includes(role) },
    '@/modules/calendar/lib/calendar-audience': { getAudienceTypesForViewer: role => ['ADMIN','SUPERADMIN','ADMIN_OPERATOR'].includes(role) ? ['ALL','TEACHERS','PARENTS'] : ['TEACHER','ADMIN_TEACHER'].includes(role) ? ['ALL','TEACHERS'] : ['ALL','PARENTS'] },
  };
  vm.runInNewContext(output, { module: loaded, exports: loaded.exports, require: id => { if (!(id in mocks)) throw new Error(`Unexpected import ${id}`); return mocks[id]; } });
  return loaded.exports;
}
function matches(record, where) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(clause => matches(record, clause));
    if (key === 'AND') return value.every(clause => matches(record, clause));
    if (key === 'NOT') return !matches(record, value);
    if (value && typeof value === 'object') {
      if ('some' in value) return (record[key] ?? []).some(item => matches(item, value.some));
      if ('in' in value) return value.in.includes(record[key]);
      if ('not' in value) return record[key] !== value.not;
      return matches(record[key] ?? {}, value);
    }
    return record[key] === value;
  });
}
const legacy = { status: 'PUBLISHED', accessScope: 'LEGACY', visibility: 'PUBLIC', audienceType: 'ALL', audiences: [] };
const areaEvent = { ...legacy, accessScope: 'AREAS', visibility: 'MEMBERS', audienceAreas: [{ areaId: 'academic' }] };
const privateEvent = { ...areaEvent, accessScope: 'PEOPLE', audiences: [{ userId: 'selected' }] };
const users = [{ id: 'teacher', role: 'TEACHER' }, { id: 'family', role: 'PARENT' }, { id: 'admin', role: 'ADMIN' }, { id: 'selected', role: 'TEACHER' }];

test('public and family queries preserve legacy visibility and exclude institutional events', async () => {
  const { getCalendarReadWhere } = loadAccess(users);
  const anonymous = await getCalendarReadWhere();
  assert.equal(matches(legacy, anonymous), true);
  assert.equal(matches({ ...legacy, visibility: 'MEMBERS' }, anonymous), false);
  for (const viewer of [undefined, users[1]]) {
    const where = await getCalendarReadWhere(viewer);
    assert.equal(matches(areaEvent, where), false);
    assert.equal(matches({ ...areaEvent, accessScope: 'INTERNAL' }, where), false);
  }
});
test('area consultation requires a grant and never overrides a person restriction', async () => {
  const { getCalendarReadWhere } = loadAccess(users, [{ userId: 'teacher', areaId: 'academic', canEdit: false }]);
  assert.equal(matches(areaEvent, await getCalendarReadWhere(users[0])), true);
  assert.equal(matches(areaEvent, await getCalendarReadWhere(users[2])), false);
  assert.equal(matches(privateEvent, await getCalendarReadWhere(users[0])), false);
  assert.equal(matches(privateEvent, await getCalendarReadWhere(users[2])), false);
  assert.equal(matches(privateEvent, await getCalendarReadWhere(users[3])), true);
  assert.equal(matches({ ...areaEvent, status: 'DRAFT' }, await getCalendarReadWhere(users[0])), false);
});
test('edit requires responsible-area grant, preserves legacy management and restricts global managers', async () => {
  const { getCalendarEditWhere } = loadAccess(users, [{ userId: 'teacher', areaId: 'academic', canEdit: true }]);
  const event = { ...areaEvent, responsibleAreaId: 'academic' };
  const teacher = { ...users[0], permissionKeys: [] };
  const admin = { ...users[2], permissionKeys: ['calendar.manage'] };
  assert.equal(matches(event, await getCalendarEditWhere(teacher)), true);
  assert.equal(matches({ ...event, responsibleAreaId: 'operations' }, await getCalendarEditWhere(teacher)), false);
  assert.equal(matches({ ...privateEvent, responsibleAreaId: 'academic' }, await getCalendarEditWhere(teacher)), false);
  assert.equal(matches(privateEvent, await getCalendarEditWhere(admin)), false);
  assert.equal(matches(legacy, await getCalendarEditWhere(admin)), true);
  assert.equal(matches(legacy, await getCalendarEditWhere(teacher)), false);
});
