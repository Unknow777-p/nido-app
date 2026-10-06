import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { databaseUrl, getPglite } from "./lib/db";
import { pgliteDialect } from "./lib/pglite-dialect";
import { UnauthorizedError } from "./rpc";
const env = (key) => process.env[key]?.trim() || void 0;
const baseURL = env("BETTER_AUTH_URL") ?? "http://localhost:5173";
const origins = /* @__PURE__ */ new Set([
  baseURL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  `http://localhost:${env("PORT") ?? "3000"}`,
  `http://127.0.0.1:${env("PORT") ?? "3000"}`
]);
const database = databaseUrl ? new Pool({ connectionString: databaseUrl }) : { dialect: pgliteDialect(() => getPglite()), type: "postgres" };
const auth = betterAuth({
  baseURL,
  secret: env("BETTER_AUTH_SECRET") ?? "dev-only-secret-change-me-please-0123456789",
  database,
  trustedOrigins: [...origins],
  emailAndPassword: { enabled: true },
  session: { cookieCache: { enabled: true, maxAge: 300 } }
});
function toHeaders(req) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === void 0) continue;
    if (Array.isArray(value)) for (const v of value) headers.append(key, v);
    else headers.set(key, value);
  }
  return headers;
}
async function requireUserId(req) {
  const session = await auth.api.getSession({ headers: toHeaders(req) });
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}
export {
  auth,
  requireUserId
};
