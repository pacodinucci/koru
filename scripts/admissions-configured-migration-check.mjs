import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import pg from 'pg';

// Read-only evidence checks around a separately authorized Prisma deployment.
// Never print connection credentials or private contact payloads.
const mode = process.argv[2];
assert.ok(['before', 'after'].includes(mode), 'Use before or after');
assert.ok(process.env.DATABASE_URL, 'Configured DATABASE_URL required');
const migration = '20261118160000_admission_inquiry';
const evidencePath = '.tmp-admissions-e2e/configured-migration-before.json';
const sql = await readFile(`prisma/migrations/${migration}/migration.sql`, 'utf8');
const checksum = createHash('sha256').update(sql).digest('hex');
const connection = new URL(process.env.DATABASE_URL);
if (['prefer', 'require', 'verify-ca'].includes(connection.searchParams.get('sslmode')) && !connection.searchParams.has('uselibpqcompat')) connection.searchParams.set('uselibpqcompat', 'true');
const client = new pg.Client({ connectionString: connection.toString() });
await client.connect();
try {
  await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const failed = await client.query('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL');
  assert.equal(failed.rowCount, 0, 'A failed migration requires explicit resolution; refusing to proceed');
  const history = (await client.query('SELECT migration_name, checksum FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')).rows;
  const applied = new Set(history.map((row) => row.migration_name));
  const local = (await readdir('prisma/migrations')).filter((name) => /^\d/.test(name));
  const pending = local.filter((name) => !applied.has(name)).sort();
  const contacts = (await client.query('SELECT count(*)::text AS count, md5(COALESCE(string_agg(md5(row_to_json(t)::text), \'\' ORDER BY id), \'\')) AS fingerprint FROM "ContactMessage" t')).rows[0];
  const tableExists = (await client.query(`SELECT to_regclass('public."AdmissionInquiry"') IS NOT NULL AS present`)).rows[0].present;
  if (mode === 'before') {
    assert.deepEqual(pending, [migration], 'Only admissions may be pending for this authorization');
    assert.equal(tableExists, false, 'Unexpected existing inquiry table requires explicit drift inspection');
    await mkdir('.tmp-admissions-e2e', { recursive: true });
    await writeFile(evidencePath, JSON.stringify({ migration, checksum, contacts, capturedAt: new Date().toISOString() }, null, 2));
    console.log(`PASS preflight: only admissions pending, no failed migrations, no inquiry table; contact count and content fingerprint recorded without private payloads (${contacts.count} records).`);
  } else {
    const before = JSON.parse(await readFile(evidencePath, 'utf8'));
    assert.equal(before.migration, migration); assert.equal(before.checksum, checksum);
    assert.deepEqual(pending, [], 'Unexpected migrations still pending');
    assert.equal(history.find((row) => row.migration_name === migration)?.checksum, checksum, 'Applied migration checksum differs');
    assert.equal(tableExists, true);
    const columns = (await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='AdmissionInquiry'`)).rows.map((row) => row.column_name).sort();
    assert.deepEqual(columns, ['id','guardianNames','childName','email','phone','answers','questionnaireVersion','idempotencyKey','fingerprint','status','submittedAt','createdAt','updatedAt'].sort());
    const indexes = (await client.query(`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='AdmissionInquiry'`)).rows.map((row) => row.indexname);
    for (const name of ['AdmissionInquiry_pkey','AdmissionInquiry_idempotencyKey_key','AdmissionInquiry_status_submittedAt_idx','AdmissionInquiry_submittedAt_id_idx']) assert.ok(indexes.includes(name), `Missing index: ${name}`);
    const inquiries = (await client.query('SELECT count(*)::text AS count FROM "AdmissionInquiry"')).rows[0].count;
    assert.equal(inquiries, '0', 'Migration unexpectedly created inquiry records');
    assert.deepEqual(contacts, before.contacts, 'Contact snapshot changed; investigate concurrent writes before attributing causality');
    console.log(`PASS postflight: migration checksum/history, all columns and indexes verified; zero inquiry records created; all ${contacts.count} existing contact records retain the same full-row fingerprint.`);
  }
  await client.query('COMMIT');
} finally { await client.end(); }
