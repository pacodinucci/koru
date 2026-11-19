import assert from 'node:assert/strict';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { hashPassword } from 'better-auth/crypto';

// Never fall back to the application's configured DATABASE_URL.
const target = process.env.TEST_DATABASE_URL;
const schemaBaseline = process.argv.includes('--schema-baseline');
const expectedDatabase = schemaBaseline ? 'admissions_schema_e2e' : 'admissions_e2e';
if (!target || target !== `postgresql://admissions_test@127.0.0.1:55549/${expectedDatabase}`) throw new Error('Explicit disposable admissions TEST_DATABASE_URL required');
const client = new pg.Client({ connectionString: target });
await client.connect();
try {
  const migrations = (await readdir('prisma/migrations')).filter((name) => /^\d/.test(name)).sort();
  const featureMigration = '20261118160000_admission_inquiry';
  assert.ok(migrations.includes(featureMigration));
  if (schemaBaseline) {
    console.log('LIMITATION: equivalent schema baseline, NOT full historical migration-chain proof.');
    await client.query(await readFile('.tmp-admissions-e2e/baseline.sql', 'utf8'));
  } else {
    for (const name of migrations.filter((name) => name !== featureMigration)) {
      console.log(`Applying historical migration ${name}`);
      await client.query(await readFile(path.join('prisma/migrations', name, 'migration.sql'), 'utf8'));
    }
  }
  await client.query(`INSERT INTO "ContactMessage" (id,nombre,email,telefono,mensaje,status,"createdAt","updatedAt") VALUES ('historical-contact','Familia Histórica','history@example.test',NULL,'Mensaje histórico completo <script>inert</script>','REPLIED','2020-01-01','2020-01-02')`);
  const before = (await client.query('SELECT * FROM "ContactMessage" ORDER BY id')).rows;
  await client.query(await readFile(path.join('prisma/migrations', featureMigration, 'migration.sql'), 'utf8'));
  const after = (await client.query('SELECT * FROM "ContactMessage" ORDER BY id')).rows;
  assert.deepEqual(after, before);
  assert.equal((await client.query('SELECT count(*)::int AS count FROM "AdmissionInquiry"')).rows[0].count, 0);
  const password = 'Admissions-Disposable-Test-Only-2026!';
  const passwordHash = await hashPassword(password);
  for (const [id, role] of [['admissions-admin','ADMIN'],['admissions-parent','PARENT']]) {
    await client.query('INSERT INTO "user" (id,name,email,role,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,$3,true,now(),now())', [id, `${id}@example.test`, role]);
    await client.query('INSERT INTO "account" (id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES ($1,$1,\'credential\',$1,$2,now(),now())', [id, passwordHash]);
  }
  // Interleaved/tied rows intentionally include identical IDs across sources.
  for (let index = 0; index < 23; index++) {
    const id = `mixed-${String(index).padStart(2,'0')}`;
    const date = new Date(Date.UTC(2026, 0, 1, 0, 0, Math.floor(index / 2)));
    if (index % 2 === 0) await client.query('INSERT INTO "ContactMessage" (id,nombre,email,mensaje,status,"createdAt","updatedAt") VALUES ($1,$2,$3,\'Original contact\',\'NEW\',$4,$4)', [id, `Mixed ${index}`, `mixed${index}@example.test`, date]);
    else await client.query('INSERT INTO "AdmissionInquiry" (id,"guardianNames","childName",email,phone,answers,"questionnaireVersion","idempotencyKey",fingerprint,status,"submittedAt","createdAt","updatedAt") VALUES ($1,$2,\'Child\',$3,\'1234567\',$4,\'initial-v1\',$5,\'seed\',\'READ\',$6,$6,$6)', [id, `Mixed ${index}`, `mixed${index}@example.test`, JSON.stringify({ childName: `Child ${index}` }), `seed-${index}`, date]);
  }
  await client.query('INSERT INTO "AdmissionInquiry" (id,"guardianNames","childName",email,phone,answers,"questionnaireVersion","idempotencyKey",fingerprint,"submittedAt","createdAt","updatedAt") VALUES (\'mixed-00\',\'Same local ID\',\'Other child\',\'other@example.test\',\'1234567\',\'{"childName":"Other child"}\',\'initial-v1\',\'seed-same-id\',\'seed\',\'2026-01-01\',now(),now())');
  await mkdir('.tmp-admissions-e2e', { recursive: true });
  await writeFile('.tmp-admissions-e2e/migration-evidence.json', JSON.stringify({ passed: true, historicalRowsPreserved: before.length, migration: featureMigration, baseline: schemaBaseline ? 'equivalent-schema-not-full-chain' : 'historical-migrations' }, null, 2));
  console.log('PASS additive migration preserves historical contact IDs, content, timestamps and statuses. Disposable baseline and mixed-source fixtures ready.');
} finally { await client.end(); }
