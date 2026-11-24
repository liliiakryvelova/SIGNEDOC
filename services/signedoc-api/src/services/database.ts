import { Pool, type PoolClient, type PoolConfig } from 'pg';
import { DefaultAzureCredential } from '@azure/identity';
import type { AppConfig } from './config.js';
import type { IDatabaseService, QueryOptions } from './interfaces/IDatabaseService.js';

const TABLES: Record<string, string> = { user: 'users', users: 'users', document: 'documents', documents: 'documents', recipient: 'recipients', recipients: 'recipients', auditEvent: 'audit_events', auditEvents: 'audit_events' };
type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

function tableName(collection: string): string {
  const table = TABLES[collection];
  if (!table) throw new Error(`Unknown database collection: ${collection}`);
  return table;
}
function toSnake(value: string): string { return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`); }
function toCamel(value: string): string { return value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()); }
function fromRow<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamel(key), value instanceof Date ? value.toISOString() : value])) as T;
}
function sqlIdentifier(value: string): string {
  const snake = toSnake(value);
  if (!/^[a-z][a-z0-9_]*$/.test(snake)) throw new Error('Invalid database identifier.');
  return `"${snake}"`;
}
function whereClause(filter: Record<string, unknown> | undefined, values: unknown[], startIndex = 1): string {
  if (!filter || Object.keys(filter).length === 0) return '';
  const clauses = Object.entries(filter).map(([key, value]) => {
    const column = sqlIdentifier(key);
    if (value === null) return `${column} IS NULL`;
    values.push(value);
    return `${column} = $${startIndex + values.length - 1}`;
  });
  return ` WHERE ${clauses.join(' AND ')}`;
}

export class PostgresDatabaseService implements IDatabaseService {
  private readonly pool: Pool;
  constructor(config: AppConfig, private readonly transactionClient?: PoolClient) {
    if (transactionClient) {
      this.pool = null as unknown as Pool;
      return;
    }
    const url = new URL(config.databaseUrl);
    const poolConfig: PoolConfig = {
      host: url.hostname, port: Number(url.port || 5432), database: decodeURIComponent(url.pathname.slice(1)), user: decodeURIComponent(url.username),
      max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000,
      ...(config.environment === 'Development'
        ? { password: decodeURIComponent(url.password) }
        : { ssl: { rejectUnauthorized: true }, password: async () => {
          const credential = new DefaultAzureCredential();
          const accessToken = await credential.getToken('https://ossrdbms-aad.database.windows.net/.default');
          if (!accessToken) throw new Error('Could not acquire an Azure Database for PostgreSQL access token.');
          return accessToken.token;
        } }),
    };
    this.pool = new Pool(poolConfig);
  }

  private queryable(): Queryable { return this.transactionClient ?? this.pool; }
  async findAll<T>(collection: string, options: QueryOptions = {}): Promise<T[]> {
    const values: unknown[] = [];
    const where = whereClause(options.filter, values);
    const order = options.orderBy ? ` ORDER BY ${sqlIdentifier(options.orderBy)} ${(options.orderDirection ?? 'asc').toUpperCase()}` : '';
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 500); const offset = Math.max(options.offset ?? 0, 0);
    values.push(limit, offset);
    const result = await this.queryable().query(`SELECT * FROM "${tableName(collection)}"${where}${order} LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return result.rows.map((row) => fromRow<T>(row as Record<string, unknown>));
  }
  async findById<T>(collection: string, id: string): Promise<T | null> {
    const result = await this.queryable().query('SELECT * FROM "' + tableName(collection) + '" WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? fromRow<T>(result.rows[0] as Record<string, unknown>) : null;
  }
  async findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
    const values: unknown[] = []; const where = whereClause(filter, values);
    const result = await this.queryable().query(`SELECT * FROM "${tableName(collection)}"${where} LIMIT 1`, values);
    return result.rows[0] ? fromRow<T>(result.rows[0] as Record<string, unknown>) : null;
  }
  async create<T>(collection: string, data: T): Promise<T> {
    const entries = Object.entries(data as Record<string, unknown>).filter(([, value]) => value !== undefined);
    if (entries.length === 0) throw new Error('Cannot create an empty database record.');
    const columns = entries.map(([key]) => sqlIdentifier(key)); const values = entries.map(([, value]) => value);
    const placeholders = values.map((_value, index) => `$${index + 1}`);
    const result = await this.queryable().query(`INSERT INTO "${tableName(collection)}" (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return fromRow<T>(result.rows[0] as Record<string, unknown>);
  }
  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const entries = Object.entries(data as Record<string, unknown>).filter(([key, value]) => key !== 'id' && value !== undefined);
    if (entries.length === 0) return this.findById<T>(collection, id);
    const values = entries.map(([, value]) => value); const assignments = entries.map(([key], index) => `${sqlIdentifier(key)} = $${index + 1}`);
    values.push(id);
    const result = await this.queryable().query(`UPDATE "${tableName(collection)}" SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
    return result.rows[0] ? fromRow<T>(result.rows[0] as Record<string, unknown>) : null;
  }
  async delete(collection: string, id: string): Promise<boolean> { const result = await this.queryable().query(`DELETE FROM "${tableName(collection)}" WHERE id = $1`, [id]); return (result.rowCount ?? 0) > 0; }
  async count(collection: string, filter?: Record<string, unknown>): Promise<number> {
    const values: unknown[] = []; const where = whereClause(filter, values);
    const result = await this.queryable().query(`SELECT COUNT(*)::int AS count FROM "${tableName(collection)}"${where}`, values);
    return Number(result.rows[0]?.count ?? 0);
  }
  async healthCheck(): Promise<boolean> { try { await this.queryable().query('SELECT 1'); return true; } catch { return false; } }
  async transaction<T>(callback: (transaction: IDatabaseService) => Promise<T>): Promise<T> {
    if (this.transactionClient) return callback(this);
    const client = await this.pool.connect();
    try { await client.query('BEGIN'); const result = await callback(new PostgresDatabaseService({} as AppConfig, client)); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async close(): Promise<void> { await this.pool.end(); }
}