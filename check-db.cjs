const pg = require("pg");
const fs = require("fs");
const cs = fs.readFileSync(".env", "utf8").match(/DATABASE_URL=(.*)/)[1].trim();
(async () => {
  const c = new pg.Client({ connectionString: cs });
  await c.connect();
  const r = await c.query("select tablename from pg_tables where schemaname='public' order by 1");
  console.log("TABLAS:", r.rows.map((x) => x.tablename).join(", "));
  try {
    const m = await c.query("select name from _migrations order by 1");
    console.log("MIGRACIONES:", m.rows.map((x) => x.name).join(", "));
  } catch {
    console.log("MIGRACIONES: tabla _migrations no existe");
  }
  await c.end();
})().catch((e) => console.log("ERR", e.message));
