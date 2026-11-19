import test from 'node:test';
import assert from 'node:assert/strict';
import { permissionCatalog, legacyRolePermissions, withSuperAdminPermissions } from '../../src/modules/auth/permissions/permission-catalog';
import { authorizeContacts } from '../../src/modules/contacts/contacts.domain';

test('SUPERADMIN inherits Contactos access already available to ADMIN', () => {
  assert.equal(authorizeContacts('ADMIN'), true);
  assert.equal(authorizeContacts('SUPERADMIN'), true);
  assert.equal(authorizeContacts('PARENT'), false);
});
test('Superadmin effective permissions include every capability; other role restrictions remain', () => {
  assert.deepEqual(withSuperAdminPermissions('SUPERADMIN', []), permissionCatalog.map(({ key }) => key));
  assert.deepEqual(withSuperAdminPermissions('SUPERADMIN', ['roles.view']), permissionCatalog.map(({ key }) => key));
  assert.deepEqual(withSuperAdminPermissions('ADMIN', ['blog.view']), ['blog.view']);
  assert.deepEqual(withSuperAdminPermissions('TEACHER', []), []);
});
test('Roles catalog exposes Contactos Ver and Gestionar and default admin grants', () => {
  const contacts = permissionCatalog.filter((permission) => permission.section === ('Contactos' as string));
  assert.deepEqual(contacts.map(({ key, label }) => ({ key, label })), [
    { key: 'contacts.view', label: 'Ver' },
    { key: 'contacts.manage', label: 'Gestionar' },
  ]);
  for (const role of ['ADMIN', 'SUPERADMIN'] as const) {
    assert.ok((legacyRolePermissions[role] as readonly string[]).includes('contacts.view'));
    assert.ok((legacyRolePermissions[role] as readonly string[]).includes('contacts.manage'));
  }
});
