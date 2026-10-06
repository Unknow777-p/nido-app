import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const env = (key) => process.env[key]?.trim() || void 0;
const databaseUrl = env("DATABASE_URL");
const dbSource = databaseUrl ? "postgres" : "pglite";
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v) => v;
function toSql(run) {
  const sql = (async (strings, ...values) => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    return run(text, values);
  });
  sql.query = (text, params = []) => run(text, params);
  return sql;
}
const migrationsDir = resolve(process.cwd(), "migrations");
function migrationFiles() {
  return readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort((a, b) => a.localeCompare(b));
}
let pglitePromise = null;
let sqlPromise = null;
async function createPostgres() {
  const { default: pg } = await import("pg");
  pg.types.setTypeParser(OID_INT8, Number);
  pg.types.setTypeParser(OID_DATE, identity);
  pg.types.setTypeParser(OID_INTERVAL, identity);
  const pool = new pg.Pool({ connectionString: databaseUrl });
  await migrate({
    applied: async () => (await pool.query("select name from _migrations")).rows.map((r) => r.name),
    ensure: async () => {
      await pool.query(
        "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())"
      );
    },
    apply: async (name, sqlText) => {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query(sqlText);
        await client.query("insert into _migrations (name) values ($1)", [name]);
        await client.query("commit");
      } catch (err) {
        await client.query("rollback");
        throw err;
      } finally {
        client.release();
      }
    }
  });
  return toSql(async (text, params) => (await pool.query(text, params)).rows);
}
function getPglite() {
  if (dbSource !== "pglite") throw new Error("getPglite() solo existe sin DATABASE_URL");
  pglitePromise ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = env("PGLITE_DIR");
    const pg = new PGlite(dir ? resolve(dir) : void 0, {
      parsers: { [OID_INT8]: Number, [OID_DATE]: identity, [OID_INTERVAL]: identity }
    });
    await pg.waitReady;
    await migrate({
      applied: async () => (await pg.query("select name from _migrations")).rows.map((r) => r.name),
      ensure: async () => {
        await pg.exec(
          "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())"
        );
      },
      apply: async (name, sqlText) => {
        await pg.transaction(async (tx) => {
          await tx.exec(sqlText);
          await tx.query("insert into _migrations (name) values ($1)", [name]);
        });
      }
    });
    return pg;
  })().catch((err) => {
    pglitePromise = null;
    throw err;
  });
  return pglitePromise;
}
async function migrate(io) {
  await io.ensure();
  const done = new Set(await io.applied());
  for (const file of migrationFiles()) {
    if (done.has(file)) continue;
    await io.apply(file, readFileSync(join(migrationsDir, file), "utf8"));
    console.log(`[db] migraci\xF3n aplicada: ${file}`);
  }
}
async function createSql() {
  if (dbSource === "postgres") return createPostgres();
  const pg = await getPglite();
  return toSql(async (text, params) => (await pg.query(text, params)).rows);
}
function getSql() {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null;
    throw err;
  });
  return sqlPromise;
}
export {
  databaseUrl,
  dbSource,
  getPglite,
  getSql
};
