const pg = require("pg");
const fs = require("fs");
const cs = fs.readFileSync(".env", "utf8").match(/DATABASE_URL=(.*)/)[1].trim();
(async () => {
  const c = new pg.Client({ connectionString: cs });
  await c.connect();
  const tables = [
    "activity_log",
    "time_requests",
    "extra_grants",
    "usage_days",
    "app_toggles",
    "allowed_sites",
    "blocked_sites",
    "filter_settings",
    "day_limits",
    "children",
    "families",
    "payments"
  ];
  for (const t of tables) {
    try {
      await c.query(`truncate table ${t} restart identity cascade`);
      console.log("OK:", t);
    } catch (e) {
      console.log("ERR:", t, e.message);
    }
  }
  const r = await c.query("select count(*) as n from families");
  console.log("families filas:", r.rows[0].n);
  await c.end();
})().catch((e) => console.log("ERR", e.message));
