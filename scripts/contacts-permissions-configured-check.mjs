import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import pg from 'pg';
const mode = process.argv[2];
assert.ok(['before','after'].includes(mode));
assert.ok(process.env.DATABASE_URL, 'Explicitly authorized configured target required');
const migration = '20261119090000_contacts_permissions';
const checksum = createHash('sha256').update(await readFile(`prisma/migrations/${migration}/migration.sql`,'utf8')).digest('hex');
const evidence = '.tmp-admissions-e2e/contacts-permissions-configured-before.json';
const url = new URL(process.env.DATABASE_URL);
if (['prefer','require','verify-ca'].includes(url.searchParams.get('sslmode')) && !url.searchParams.has('uselibpqcompat')) url.searchParams.set('uselibpqcompat','true');
const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
try {
  await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  assert.equal((await client.query('SELECT count(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL')).rows[0].count,0,'Failed migration requires separate authorization');
  const applied = (await client.query('SELECT migration_name,checksum FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')).rows;
  const names = new Set(applied.map((row) => row.migration_name));
  const pending = (await readdir('prisma/migrations')).filter((name) => /^\d/.test(name) && !names.has(name)).sort();
  const snapshot = (await client.query(`SELECT 'contacts' AS source,count(*)::text AS count,md5(COALESCE(string_agg(md5(row_to_json(t)::text),'' ORDER BY id),'')) AS fingerprint FROM "ContactMessage" t UNION ALL SELECT 'inquiries',count(*)::text,md5(COALESCE(string_agg(md5(row_to_json(t)::text),'' ORDER BY id),'')) FROM "AdmissionInquiry" t ORDER BY source`)).rows;
  const custom = (await client.query(`SELECT role.id, md5(COALESCE(string_agg(permission.key,',' ORDER BY permission.key),'')) AS grants FROM "Role" role LEFT JOIN "RolePermission" granted ON granted."roleId"=role.id LEFT JOIN "Permission" permission ON permission.id=granted."permissionId" WHERE NOT (role."isSystem"=true AND role.key IN ('ADMIN','SUPERADMIN')) GROUP BY role.id ORDER BY role.id`)).rows;
  if (mode === 'before') {
    assert.deepEqual(pending,[migration],'Only the scoped Contactos permission migration may be pending');
    await mkdir('.tmp-admissions-e2e',{ recursive:true });
    await writeFile(evidence,JSON.stringify({ checksum,snapshot,custom },null,2));
    console.log('PASS preflight: only Contactos permission migration pending; no failures; private payload fingerprints and unrelated role grants recorded without payload logging.');
  } else {
    const before = JSON.parse(await readFile(evidence,'utf8'));
    assert.deepEqual(pending,[]); assert.equal(before.checksum,checksum);
    assert.equal(applied.find((row) => row.migration_name===migration)?.checksum,checksum);
    assert.deepEqual(snapshot,before.snapshot,'Private payload snapshot changed; investigate concurrent writes before attributing causality');
    assert.deepEqual(custom,before.custom,'Unrelated role grants changed');
    const definitions = (await client.query(`SELECT key,section,label FROM "Permission" WHERE key IN ('contacts.view','contacts.manage') ORDER BY key`)).rows;
    assert.deepEqual(definitions,[{key:'contacts.manage',section:'Contactos',label:'Gestionar'},{key:'contacts.view',section:'Contactos',label:'Ver'}]);
    const roles = (await client.query(`SELECT role.key,count(DISTINCT permission.key)::int AS count FROM "Role" role LEFT JOIN "RolePermission" granted ON granted."roleId"=role.id LEFT JOIN "Permission" permission ON permission.id=granted."permissionId" AND permission.key IN ('contacts.view','contacts.manage') WHERE role."isSystem"=true AND role.key IN ('ADMIN','SUPERADMIN') GROUP BY role.key ORDER BY role.key`)).rows;
    assert.deepEqual(roles,[{key:'ADMIN',count:2},{key:'SUPERADMIN',count:2}]);
    console.log('PASS postflight: migration checksum and both Contactos permissions verified; system ADMIN/SUPERADMIN grants present; all contacts/inquiries and unrelated role permissions unchanged.');
  }
  await client.query('COMMIT');
} finally { await client.end(); }
