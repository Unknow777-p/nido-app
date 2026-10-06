import { AsyncLocalStorage } from "node:async_hooks";
const als = new AsyncLocalStorage();
function runWithRequest(info, fn) {
  return als.run(info, fn);
}
function currentRequest() {
  const store = als.getStore();
  if (!store) throw new Error("Sin petici\xF3n activa.");
  return store.req;
}
function publicOrigin() {
  const req = currentRequest();
  const first = (v) => (Array.isArray(v) ? v[0] : v)?.split(",")[0]?.trim();
  const host = first(req.headers["x-forwarded-host"]) ?? req.headers.host ?? "localhost:3000";
  const proto = first(req.headers["x-forwarded-proto"]) ?? req.protocol;
  return `${proto}://${host}`;
}
class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Inicia sesi\xF3n para continuar.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
const authMiddleware = { kind: "auth" };
const registry = /* @__PURE__ */ new Map();
const pending = [];
class Builder {
  constructor(mw, validate) {
    this.mw = mw;
    this.validate = validate;
  }
  mw;
  validate;
  middleware(mw) {
    return new Builder(mw, this.validate);
  }
  validator(fn) {
    return new Builder(this.mw, fn);
  }
  inputValidator(fn) {
    return this.validator(fn);
  }
  handler(fn) {
    const entry = {
      needsAuth: this.mw.includes(authMiddleware),
      validate: this.validate,
      run: fn
    };
    pending.push(entry);
    const direct = (async (opts) => entry.run({ data: entry.validate ? entry.validate(opts?.data) : opts?.data, context: {} }));
    direct.__entry = entry;
    return direct;
  }
}
function createServerFn(_opts) {
  return new Builder([], null);
}
function registerAll(mod) {
  for (const [name, value] of Object.entries(mod)) {
    const entry = value?.__entry;
    if (entry) registry.set(name, entry);
  }
  pending.length = 0;
}
export {
  UnauthorizedError,
  authMiddleware,
  createServerFn,
  currentRequest,
  publicOrigin,
  registerAll,
  registry,
  runWithRequest
};
