import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;
const localSettingsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../local.settings.json');
let localSettings;
try { localSettings = JSON.parse(await readFile(localSettingsPath, 'utf8')); } catch { /* Environment variables can configure migrations without a local settings file. */ }
const databaseUrl = process.env.DATABASE_URL ?? localSettings?.Values?.DATABASE_URL;
if (!databaseUrl) throw new Error('Set DATABASE_URL before applying database migrations.');

const directory = path.dirname(fileURLToPath(import.meta.url));
const files = (await readdir(directory)).filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file)).sort();
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    checksum char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  for (const name of files) {
    const sql = await readFile(path.join(directory, name), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query('SELECT checksum FROM schema_migrations WHERE name = $1', [name]);
    if (existing.rows[0]) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration ${name} has changed; create a new migration instead.`);
      continue;
    }

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
      await client.query('COMMIT');
      console.info(`Applied ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
  console.info('Database schema is up to date. No application or seed data was inserted.');
} finally {
  await client.end();
}