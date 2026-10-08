const pg = require("pg");
const fs = require("fs");
const cs = fs.readFileSync(".env", "utf8").match(/DATABASE_URL=(.*)/)[1].trim();
(async () => {
  const c = new pg.Client({ connectionString: cs });
  await c.connect();
  const tables = [
    "user",
    "account",
    "session",
    "verification",
    "sessionTokens",
    "payMet",
    "customers"
  ];
  for (const t of tables) {
    try {
      await c.query(`truncate table "${t}" restart identity cascade`);
      console.log("OK:", t);
    } catch (e) {
      console.log("ERR:", t, e.message);
    }
  }
  const count = await c.query('select count(*) as n from "user"');
  console.log("usuarios:", count.rows[0].n);
  await c.end();
})().catch((e) => console.log("ERR", e.message));
