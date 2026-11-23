import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { hashPassword } from 'better-auth/crypto';
const target = process.env.TEST_DATABASE_URL;
if (target !== 'postgresql://admissions_test@127.0.0.1:55549/admissions_schema_e2e') throw new Error('Explicit disposable target required');
const client = new pg.Client({ connectionString: target });
await client.connect();
try {
  const snapshot = async () => (await client.query(`SELECT 'contacts' AS source, count(*)::text AS count, md5(COALESCE(string_agg(md5(row_to_json(t)::text), '' ORDER BY id),'')) AS fingerprint FROM "ContactMessage" t UNION ALL SELECT 'inquiries', count(*)::text, md5(COALESCE(string_agg(md5(row_to_json(t)::text), '' ORDER BY id),'')) FROM "AdmissionInquiry" t ORDER BY source`)).rows;
  for (const [id, key, baseRole, isSystem] of [
    ['test_role_admin','ADMIN','ADMIN',true], ['test_role_superadmin','SUPERADMIN','SUPERADMIN',true],
    ['test_role_reader','CONTACTS_READER','TEACHER',false], ['test_role_manager','CONTACTS_MANAGER','TEACHER',false], ['test_role_restricted','CONTACTS_RESTRICTED','ADMIN',false],
  ]) {
    await client.query('INSERT INTO "Role" (id,key,name,"baseRole","isSystem","isProtected","isActive","updatedAt") VALUES ($1,$2,$2,$3,$4,$4,true,now()) ON CONFLICT (id) DO NOTHING', [id,key,baseRole,isSystem]);
  }
  await client.query(`INSERT INTO "Permission" (id,key,section,action,label,"updatedAt") VALUES ('test_dashboard_access','dashboard.access','Dashboard','access','Acceder al dashboard',now()) ON CONFLICT (key) DO NOTHING`);
  await client.query(`INSERT INTO "RolePermission" ("roleId","permissionId") SELECT role.id,permission.id FROM "Role" role CROSS JOIN "Permission" permission WHERE role.id LIKE 'test_role_%' AND permission.key='dashboard.access' ON CONFLICT DO NOTHING`);
  const before = await snapshot();
  const sql = await readFile('prisma/migrations/20261119090000_contacts_permissions/migration.sql','utf8');
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  assert.deepEqual(await snapshot(), before, 'Permission migration changed contact/inquiry payloads');
  const definitions = (await client.query(`SELECT key,section,label FROM "Permission" WHERE key IN ('contacts.view','contacts.manage') ORDER BY key`)).rows;
  assert.deepEqual(definitions, [{ key:'contacts.manage',section:'Contactos',label:'Gestionar' },{ key:'contacts.view',section:'Contactos',label:'Ver' }]);
  const defaults = (await client.query(`SELECT role.key,permission.key AS permission FROM "RolePermission" grant_row JOIN "Role" role ON role.id=grant_row."roleId" JOIN "Permission" permission ON permission.id=grant_row."permissionId" WHERE permission.key LIKE 'contacts.%' ORDER BY role.key,permission.key`)).rows;
  assert.deepEqual(defaults,[{key:'ADMIN',permission:'contacts.manage'},{key:'ADMIN',permission:'contacts.view'},{key:'SUPERADMIN',permission:'contacts.manage'},{key:'SUPERADMIN',permission:'contacts.view'}]);
  // Intentional explicit grants for browser fixtures, after proving no auto-grants to custom roles.
  await client.query(`INSERT INTO "RolePermission" ("roleId","permissionId") SELECT role.id,permission.id FROM "Role" role CROSS JOIN "Permission" permission WHERE (role.id='test_role_reader' AND permission.key='contacts.view') OR (role.id='test_role_manager' AND permission.key IN ('contacts.view','contacts.manage')) ON CONFLICT DO NOTHING`);
  const hash = await hashPassword('Admissions-Disposable-Test-Only-2026!');
  for (const [id,role,accessRole] of [['contacts-super','SUPERADMIN','test_role_superadmin'],['contacts-reader','TEACHER','test_role_reader'],['contacts-manager','TEACHER','test_role_manager'],['contacts-restricted','ADMIN','test_role_restricted']]) {
    await client.query('INSERT INTO "user" (id,name,email,role,"accessRoleId","emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,$3,$4,true,now(),now()) ON CONFLICT (id) DO UPDATE SET "accessRoleId"=EXCLUDED."accessRoleId"',[id,`${id}@example.test`,role,accessRole]);
    await client.query('INSERT INTO "account" (id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES ($1,$1,\'credential\',$1,$2,now(),now()) ON CONFLICT (id) DO UPDATE SET password=EXCLUDED.password',[id,hash]);
  }
  console.log('PASS permission definitions, ADMIN/SUPERADMIN defaults, preserved custom-role restrictions and unchanged contact/inquiry fingerprints. Real-session fixtures prepared.');
} finally { await client.end(); }
