const pg = require("pg");
const fs = require("fs");
const cs = fs.readFileSync(".env", "utf8").match(/DATABASE_URL=(.*)/)[1].trim();
(async () => {
  const c = new pg.Client({ connectionString: cs });
  await c.connect();
  const r = await c.query('select id, email, name, "createdAt" from "user" order by "createdAt"');
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
})().catch((e) => console.log("ERR", e.message));
