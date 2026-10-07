import { authMiddleware, createServerFn } from "./rpc";
import { z } from "zod";
import { getSql } from "./lib/db";
import { hashSecret, hashToken, newId, newPairingCode, newPairingToken, verifySecret } from "./lib/crypto-secret";
import { AGE_BANDS, AVATAR_KEYS } from "@/lib/filter/catalog";
import { classifyUrl } from "@/lib/filter/classify";
import { resolvePlan, trialEndsFrom } from "@/lib/family/billing";
const pinSchema = z.string().regex(/^\d{4,6}$/, "El PIN debe tener 4 a 6 d\xEDgitos");
const ageSchema = z.enum(["6-9", "10-12", "13-15", "16-17"]);
const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
function asIso(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}
function asDay(value) {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}
function weekdayFromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}
function inBedtime(localMinutes, start, end) {
  if (!start || !end) return false;
  const parse = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const a = parse(start);
  const b = parse(end);
  if (a === b) return false;
  if (a < b) return localMinutes >= a && localMinutes < b;
  return localMinutes >= a || localMinutes < b;
}
function defaultsForAge(age) {
  return AGE_BANDS.find((b) => b.id === age) ?? AGE_BANDS[1];
}
function avatarForIndex(i) {
  return AVATAR_KEYS[i % AVATAR_KEYS.length];
}
async function logActivity(sql, childId, userId, kind, detail) {
  await sql`insert into activity_log (child_id, user_id, kind, detail) values (${childId}, ${userId}, ${kind}, ${detail ?? null})`;
}
async function loadFilter(sql, childId) {
  const rows = await sql`select block_adult, block_violence, block_gambling, block_drugs, block_hate, block_social, block_image_search, force_safe_search from filter_settings where child_id = ${childId}`;
  const r = rows[0];
  if (!r) {
    return {
      blockAdult: true,
      blockViolence: true,
      blockGambling: true,
      blockDrugs: true,
      blockHate: true,
      blockSocial: false,
      blockImageSearch: true,
      forceSafeSearch: true
    };
  }
  return {
    blockAdult: r.block_adult,
    blockViolence: r.block_violence,
    blockGambling: r.block_gambling,
    blockDrugs: r.block_drugs,
    blockHate: r.block_hate,
    blockSocial: r.block_social,
    blockImageSearch: r.block_image_search,
    forceSafeSearch: r.force_safe_search
  };
}
async function summarizeChild(sql, child, localDate, localMinutes) {
  const weekday = weekdayFromISO(localDate);
  const limits = await sql`select minutes from day_limits where child_id = ${child.id} and weekday = ${weekday}`;
  const usage = await sql`select seconds from usage_days where child_id = ${child.id} and day = ${localDate}`;
  const extra = await sql`select coalesce(sum(minutes), 0)::int as minutes from extra_grants where child_id = ${child.id} and day = ${localDate}`;
  const pending = await sql`select count(*)::int as n from time_requests where child_id = ${child.id} and status = 'pending'`;
  const weekStart = weekStartISO(localDate);
  const week = await sql`select coalesce(sum(seconds), 0)::int as seconds from usage_days where child_id = ${child.id} and day >= ${weekStart} and day <= ${localDate}`;
  const blockedToday = await sql`select count(*)::int as n from activity_log where child_id = ${child.id} and kind = 'block' and created_at >= ${localDate}`;
  const tamperToday = await sql`select count(*)::int as n from activity_log where child_id = ${child.id} and kind = 'tamper' and created_at >= ${localDate}`;
  const limitToday = (limits[0]?.minutes ?? child.daily_minutes) + (extra[0]?.minutes ?? 0);
  const usedToday = usage[0]?.seconds ?? 0;
  const remaining = Math.max(0, limitToday * 60 - usedToday);
  const bedtime = inBedtime(localMinutes, child.bedtime_start, child.bedtime_end);
  const weekSeconds = week[0]?.seconds ?? 0;
  const weekLocked = weekSeconds >= child.weekly_minutes * 60;
  const lastHb = child.last_heartbeat_at ? new Date(child.last_heartbeat_at).getTime() : 0;
  const paused = Boolean(child.paused);
  const lockReason = paused ? "paused" : bedtime ? "bedtime" : weekLocked ? "week" : remaining <= 0 ? "time" : "none";
  return {
    id: child.id,
    name: child.name,
    ageBand: child.age_band,
    avatarKey: child.avatar_key,
    dailyMinutes: child.daily_minutes,
    weeklyMinutes: child.weekly_minutes,
    bedtimeStart: child.bedtime_start,
    bedtimeEnd: child.bedtime_end,
    usedTodaySeconds: usedToday,
    extraTodayMinutes: extra[0]?.minutes ?? 0,
    limitTodayMinutes: limitToday,
    remainingSeconds: remaining,
    usedWeekSeconds: weekSeconds,
    remainingWeekSeconds: Math.max(0, child.weekly_minutes * 60 - weekSeconds),
    locked: lockReason !== "none",
    lockReason,
    paused,
    inBedtime: bedtime,
    devicePaired: Boolean(child.pairing_token_hash),
    deviceName: child.device_name,
    lastSeenAt: asIso(child.last_seen_at),
    online: lastHb > 0 && Date.now() - lastHb < 9e4,
    pendingRequests: pending[0]?.n ?? 0,
    blockedToday: blockedToday[0]?.n ?? 0,
    tamperToday: tamperToday[0]?.n ?? 0,
    deviceOs: child.device_os === "ios" || child.device_os === "android" ? child.device_os : null,
    systemGuard: Boolean(child.system_guard)
  };
}
function weekStartISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  const wd = date.getUTCDay();
  const offset = wd === 0 ? 6 : wd - 1;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}
async function familyForUser(sql, userId, familyId) {
  const rows = familyId
    ? await sql`select id, user_id, name, pin_hash, pin_failed, pin_locked_until, created_at, trial_ends_at, paid_until from families where user_id = ${userId} and id = ${familyId} limit 1`
    : await sql`select id, user_id, name, pin_hash, pin_failed, pin_locked_until, created_at, trial_ends_at, paid_until from families where user_id = ${userId} limit 1`;
  return rows[0] ?? null;
}
async function childOwned(sql, userId, childId) {
  const rows = await sql`select * from children where id = ${childId} and user_id = ${userId} limit 1`;
  return rows[0] ?? null;
}
async function sessionFromChild(sql, child, localDate, localMinutes) {
  const summary = await summarizeChild(sql, child, localDate, localMinutes);
  const filters = await loadFilter(sql, child.id);
  const allowed = await sql`select host from allowed_sites where child_id = ${child.id}`;
  const blocked = await sql`select host from blocked_sites where child_id = ${child.id}`;
  const toggles = await sql`select app_id, allowed from app_toggles where child_id = ${child.id}`;
  const pending = await sql`select id, child_id, minutes, reason, status, created_at from time_requests where child_id = ${child.id} and status = 'pending' order by created_at desc limit 1`;
  const appToggles = {};
  for (const t of toggles) appToggles[t.app_id] = t.allowed;
  return {
    child: summary,
    filters,
    allowed: allowed.map((r) => r.host),
    blocked: blocked.map((r) => r.host),
    appToggles,
    pendingRequest: pending[0] ? {
      id: pending[0].id,
      childId: pending[0].child_id,
      childName: child.name,
      minutes: pending[0].minutes,
      reason: pending[0].reason,
      status: pending[0].status,
      createdAt: asIso(pending[0].created_at) ?? ""
    } : null
  };
}
async function childByToken(sql, token) {
  const tokenHash = hashToken(token);
  const rows = await sql`select * from children where pairing_token_hash = ${tokenHash} or preview_token_hash = ${tokenHash} limit 1`;
  const child = rows[0];
  if (!child) return null;
  const kind = child.pairing_token_hash === tokenHash ? "pair" : "preview";
  return { child, kind };
}
const clockSchema = z.object({
  localDate: localDateSchema,
  localMinutes: z.number().int().min(0).max(24 * 60)
});
const getFamily = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ localDate: localDateSchema, localMinutes: z.number().int().min(0).max(24 * 60), familyId: z.string().optional() }).parse(input)).handler(async ({ context, data }) => {
  const sql = await getSql();
  const family = await familyForUser(sql, context.userId, data.familyId);
  if (!family) return null;
  const kids = await sql`select * from children where family_id = ${family.id} and user_id = ${context.userId} order by created_at asc`;
  const children = await Promise.all(
    kids.map((c) => summarizeChild(sql, c, data.localDate, data.localMinutes))
  );
  const pendingRows = await sql`select r.id, r.child_id, r.minutes, r.reason, r.status, r.created_at, c.name
       from time_requests r
       join children c on c.id = r.child_id
       where r.user_id = ${context.userId} and c.family_id = ${family.id} and r.status = 'pending'
       order by r.created_at desc`;
  const allFamilies = await sql`select id, name from families where user_id = ${context.userId} order by created_at asc`;
  return {
    family: { id: family.id, name: family.name, createdAt: asIso(family.created_at) ?? "" },
    families: allFamilies.map((f) => ({ id: f.id, name: f.name })),
    plan: resolvePlan(asIso(family.trial_ends_at), asIso(family.paid_until)),
    checkoutReady: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    children,
    pendingRequests: pendingRows.map((r) => ({
      id: r.id,
      childId: r.child_id,
      childName: r.name,
      minutes: r.minutes,
      reason: r.reason,
      status: r.status,
      createdAt: asIso(r.created_at) ?? ""
    }))
  };
});
const createFamily = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({
    familyName: z.string().trim().min(2).max(40),
    pin: pinSchema,
    childName: z.string().trim().min(1).max(24),
    ageBand: ageSchema
  }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const defaults = defaultsForAge(data.ageBand);
  const familyId = newId();
  const childId = newId();
  const pinHash = hashSecret(data.pin);
  const trialEnds = trialEndsFrom();
  await sql`insert into families (id, user_id, name, pin_hash, trial_ends_at) values (${familyId}, ${context.userId}, ${data.familyName}, ${pinHash}, ${trialEnds})`;
  await sql`insert into children (id, family_id, user_id, name, age_band, avatar_key, daily_minutes, weekly_minutes, bedtime_start, bedtime_end)
      values (${childId}, ${familyId}, ${context.userId}, ${data.childName}, ${data.ageBand}, ${avatarForIndex(0)}, ${defaults.daily}, ${defaults.weekly}, ${null}, ${null})`;
  await insertDefaultLimits(sql, childId, context.userId, defaults.daily);
  await sql`insert into filter_settings (child_id, user_id, block_social, block_image_search, force_safe_search)
      values (${childId}, ${context.userId}, ${defaults.blockSocial}, ${true}, ${true})`;
  await logActivity(sql, childId, context.userId, "setup", "Familia y perfil creados");
  return { familyId, childId };
});
async function insertDefaultLimits(sql, childId, userId, daily) {
  const weekend = Math.min(daily * 2, 240);
  for (let wd = 0; wd < 7; wd++) {
    const minutes = wd === 0 || wd === 6 ? weekend : daily;
    await sql`insert into day_limits (child_id, user_id, weekday, minutes) values (${childId}, ${userId}, ${wd}, ${minutes})
      on conflict (child_id, weekday) do update set minutes = excluded.minutes`;
  }
}
const addChild = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ name: z.string().trim().min(1).max(24), ageBand: ageSchema, familyId: z.string().optional() }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const family = await familyForUser(sql, context.userId, data.familyId);
  if (!family) throw new Error("Crea la familia primero.");
  const plan = resolvePlan(asIso(family.trial_ends_at), asIso(family.paid_until));
  if (plan.status === "expired") throw new Error("La prueba termin\xF3. Activa el plan de $3.99 al mes.");
  const count = await sql`select count(*)::int as n from children where user_id = ${context.userId}`;
  const n = count[0]?.n ?? 0;
  if (n >= 6) throw new Error("M\xE1ximo 6 perfiles.");
  const defaults = defaultsForAge(data.ageBand);
  const childId = newId();
  await sql`insert into children (id, family_id, user_id, name, age_band, avatar_key, daily_minutes, weekly_minutes, bedtime_start, bedtime_end)
      values (${childId}, ${family.id}, ${context.userId}, ${data.name}, ${data.ageBand}, ${avatarForIndex(n)}, ${defaults.daily}, ${defaults.weekly}, ${null}, ${null})`;
  await insertDefaultLimits(sql, childId, context.userId, defaults.daily);
  await sql`insert into filter_settings (child_id, user_id, block_social, block_image_search, force_safe_search)
      values (${childId}, ${context.userId}, ${defaults.blockSocial}, ${true}, ${true})`;
  await logActivity(sql, childId, context.userId, "setup", "Perfil a\xF1adido");
  return { childId };
});
const getChildDetail = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ childId: z.string(), localDate: localDateSchema, localMinutes: z.number().int() }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  const summary = await summarizeChild(sql, child, data.localDate, data.localMinutes);
  const dayLimits = await sql`select weekday, minutes from day_limits where child_id = ${child.id} order by weekday`;
  const filters = await loadFilter(sql, child.id);
  const blocked = await sql`select id, host from blocked_sites where child_id = ${child.id} order by host`;
  const allowed = await sql`select id, host from allowed_sites where child_id = ${child.id} order by host`;
  const toggles = await sql`select app_id, allowed from app_toggles where child_id = ${child.id}`;
  const activity = await sql`select id, kind, detail, created_at from activity_log where child_id = ${child.id} order by created_at desc limit 40`;
  const weekStart = weekStartISO(data.localDate);
  const weekRows = await sql`select day, seconds from usage_days where child_id = ${child.id} and day >= ${weekStart} and day <= ${data.localDate}`;
  const weekMap = new Map(weekRows.map((r) => [asDay(r.day), r.seconds]));
  const week = [];
  for (let i = 0; i < 7; i++) {
    const [y, m, d] = weekStart.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const iso = dt.toISOString().slice(0, 10);
    week.push({ day: iso, minutes: Math.round((weekMap.get(iso) ?? 0) / 60) });
  }
  const appToggles = {};
  for (const t of toggles) appToggles[t.app_id] = t.allowed;
  return {
    child: summary,
    dayLimits,
    filters,
    blocked,
    allowed,
    appToggles,
    activity: activity.map((a) => ({
      id: a.id,
      kind: a.kind,
      detail: a.detail,
      createdAt: asIso(a.created_at) ?? ""
    })),
    week,
    pairingCode: child.pairing_code,
    pairingExpiresAt: asIso(child.pairing_expires_at)
  };
});
const updateChild = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({
    childId: z.string(),
    name: z.string().trim().min(1).max(24).optional(),
    dailyMinutes: z.number().int().min(15).max(480).optional(),
    weeklyMinutes: z.number().int().min(60).max(2500).optional(),
    bedtimeStart: z.string().nullable().optional(),
    bedtimeEnd: z.string().nullable().optional()
  }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  const name = data.name ?? child.name;
  const daily = data.dailyMinutes ?? child.daily_minutes;
  const weekly = data.weeklyMinutes ?? child.weekly_minutes;
  const bedtimeStart = data.bedtimeStart === void 0 ? child.bedtime_start : data.bedtimeStart;
  const bedtimeEnd = data.bedtimeEnd === void 0 ? child.bedtime_end : data.bedtimeEnd;
  await sql`update children set name = ${name}, daily_minutes = ${daily}, weekly_minutes = ${weekly}, bedtime_start = ${bedtimeStart}, bedtime_end = ${bedtimeEnd} where id = ${child.id} and user_id = ${context.userId}`;
  return { ok: true };
});
const setDayLimits = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({
    childId: z.string(),
    limits: z.array(z.object({ weekday: z.number().int().min(0).max(6), minutes: z.number().int().min(0).max(480) }))
  }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  for (const lim of data.limits) {
    await sql`insert into day_limits (child_id, user_id, weekday, minutes) values (${child.id}, ${context.userId}, ${lim.weekday}, ${lim.minutes})
        on conflict (child_id, weekday) do update set minutes = excluded.minutes`;
  }
  await logActivity(sql, child.id, context.userId, "schedule", "Horario semanal actualizado");
  return { ok: true };
});
const updateFilters = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({
    childId: z.string(),
    filters: z.object({
      blockAdult: z.boolean(),
      blockViolence: z.boolean(),
      blockGambling: z.boolean(),
      blockDrugs: z.boolean(),
      blockHate: z.boolean(),
      blockSocial: z.boolean(),
      blockImageSearch: z.boolean(),
      forceSafeSearch: z.boolean()
    })
  }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  const f = data.filters;
  await sql`update filter_settings set
      block_adult = ${f.blockAdult},
      block_violence = ${f.blockViolence},
      block_gambling = ${f.blockGambling},
      block_drugs = ${f.blockDrugs},
      block_hate = ${f.blockHate},
      block_social = ${f.blockSocial},
      block_image_search = ${f.blockImageSearch},
      force_safe_search = ${f.forceSafeSearch}
      where child_id = ${child.id} and user_id = ${context.userId}`;
  await logActivity(sql, child.id, context.userId, "filter", "Filtros de contenido actualizados");
  return { ok: true };
});
const setAppToggle = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ childId: z.string(), appId: z.string(), allowed: z.boolean() }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  await sql`insert into app_toggles (child_id, user_id, app_id, allowed) values (${child.id}, ${context.userId}, ${data.appId}, ${data.allowed})
      on conflict (child_id, app_id) do update set allowed = excluded.allowed`;
  return { ok: true };
});
const addSite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ childId: z.string(), host: z.string().min(3).max(120), list: z.enum(["blocked", "allowed"]) }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  const host = data.host.trim().toLowerCase().replace(/^www\./, "");
  if (data.list === "blocked") {
    await sql`insert into blocked_sites (child_id, user_id, host) values (${child.id}, ${context.userId}, ${host}) on conflict (child_id, host) do nothing`;
  } else {
    await sql`insert into allowed_sites (child_id, user_id, host) values (${child.id}, ${context.userId}, ${host}) on conflict (child_id, host) do nothing`;
  }
  await logActivity(sql, child.id, context.userId, "filter", `Sitio ${data.list === "blocked" ? "bloqueado" : "permitido"}: ${host}`);
  return { ok: true };
});
const removeSite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ childId: z.string(), id: z.number().int(), list: z.enum(["blocked", "allowed"]) }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  if (data.list === "blocked") {
    await sql`delete from blocked_sites where id = ${data.id} and child_id = ${child.id} and user_id = ${context.userId}`;
  } else {
    await sql`delete from allowed_sites where id = ${data.id} and child_id = ${child.id} and user_id = ${context.userId}`;
  }
  return { ok: true };
});
const createPairingCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ childId: z.string() }).parse(input)).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  let code = newPairingCode();
  for (let i = 0; i < 5; i++) {
    const clash = await sql`select id from children where pairing_code = ${code}`;
    if (clash.length === 0) break;
    code = newPairingCode();
  }
  const expires = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
  await sql`update children set pairing_code = ${code}, pairing_expires_at = ${expires} where id = ${child.id} and user_id = ${context.userId}`;
  await logActivity(sql, child.id, context.userId, "pair", "C\xF3digo de vinculaci\xF3n generado");
  return { code };
});
const revokeDevice = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ childId: z.string() }).parse(input)).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  await sql`update children set pairing_code = null, pairing_expires_at = null, pairing_token_hash = null, preview_token_hash = null, device_name = null, last_heartbeat_at = null where id = ${child.id} and user_id = ${context.userId}`;
  await logActivity(sql, child.id, context.userId, "pair", "Dispositivo desvinculado");
  return { ok: true };
});
const grantExtraTime = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ childId: z.string(), minutes: z.number().int().min(5).max(120), localDate: localDateSchema }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  await sql`insert into extra_grants (child_id, user_id, minutes, day) values (${child.id}, ${context.userId}, ${data.minutes}, ${data.localDate})`;
  await logActivity(sql, child.id, context.userId, "grant", `+${data.minutes} min extra`);
  return { ok: true };
});
const revokeExtraTime = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ childId: z.string(), localDate: localDateSchema }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  await sql`delete from extra_grants where child_id = ${child.id} and day = ${data.localDate}`;
  await logActivity(sql, child.id, context.userId, "grant", "Tiempo extra quitado");
  return { ok: true };
});
const setChildPaused = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ childId: z.string(), paused: z.boolean() }).parse(input)).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  await sql`update children set paused = ${data.paused} where id = ${child.id} and user_id = ${context.userId}`;
  await logActivity(
    sql,
    child.id,
    context.userId,
    data.paused ? "pause" : "resume",
    data.paused ? "Dispositivo pausado por el tutor" : "Dispositivo reanudado"
  );
  return { ok: true };
});
const setSystemGuard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({
    childId: z.string(),
    deviceOs: z.enum(["android", "ios"]).nullable().optional(),
    done: z.boolean().optional()
  }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  const deviceOs = data.deviceOs === void 0 ? child.device_os : data.deviceOs;
  const done = data.done === void 0 ? Boolean(child.system_guard) : data.done;
  await sql`update children set device_os = ${deviceOs}, system_guard = ${done} where id = ${child.id} and user_id = ${context.userId}`;
  if (data.done === true) {
    await logActivity(
      sql,
      child.id,
      context.userId,
      "setup",
      deviceOs === "ios" ? "Tiempo en pantalla marcado listo" : "Family Link marcado listo"
    );
  }
  return { ok: true };
});
const respondTimeRequest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ requestId: z.number().int(), approve: z.boolean(), localDate: localDateSchema }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const rows = await sql`select id, child_id, minutes, status from time_requests where id = ${data.requestId} and user_id = ${context.userId} limit 1`;
  const req = rows[0];
  if (!req) throw new Error("Solicitud no encontrada.");
  if (req.status !== "pending") return { ok: true };
  const status = data.approve ? "approved" : "denied";
  await sql`update time_requests set status = ${status} where id = ${req.id} and user_id = ${context.userId}`;
  if (data.approve) {
    await sql`insert into extra_grants (child_id, user_id, minutes, day) values (${req.child_id}, ${context.userId}, ${req.minutes}, ${data.localDate})`;
  }
  await logActivity(sql, req.child_id, context.userId, "request", data.approve ? "Tiempo extra aprobado" : "Tiempo extra denegado");
  return { ok: true };
});
const verifyFamilyPin = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ pin: pinSchema, familyId: z.string().optional() }).parse(input)).handler(async ({ context, data }) => {
  return checkPin(context.userId, data.pin, data.familyId);
});
async function checkPin(userId, pin, familyId) {
  const sql = await getSql();
  const family = await familyForUser(sql, userId, familyId);
  if (!family) return { ok: false, locked: false, remainingAttempts: 0 };
  if (family.pin_locked_until) {
    const until = new Date(family.pin_locked_until).getTime();
    if (until > Date.now()) return { ok: false, locked: true, remainingAttempts: 0 };
  }
  const good = verifySecret(pin, family.pin_hash);
  if (good) {
    await sql`update families set pin_failed = 0, pin_locked_until = null where id = ${family.id} and user_id = ${userId}`;
    return { ok: true, locked: false, remainingAttempts: 5 };
  }
  const failed = family.pin_failed + 1;
  const lock = failed >= 5;
  await sql`update families set pin_failed = ${failed}, pin_locked_until = ${lock ? new Date(Date.now() + 15 * 60 * 1e3).toISOString() : null} where id = ${family.id} and user_id = ${userId}`;
  return { ok: false, locked: lock, remainingAttempts: Math.max(0, 5 - failed) };
}
const changePin = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ currentPin: pinSchema, newPin: pinSchema, familyId: z.string().optional() }).parse(input)).handler(async ({ context, data }) => {
  const result = await checkPin(context.userId, data.currentPin, data.familyId);
  if (!result.ok) return result;
  const sql = await getSql();
  const hash = hashSecret(data.newPin);
  const family = await familyForUser(sql, context.userId, data.familyId);
  if (!family) return { ok: false, locked: false, remainingAttempts: 0 };
  await sql`update families set pin_hash = ${hash}, pin_failed = 0, pin_locked_until = null where id = ${family.id}`;
  return { ok: true, locked: false, remainingAttempts: 5 };
});
const renameFamily = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ name: z.string().trim().min(2).max(40), familyId: z.string().optional() }).parse(input)).handler(async ({ context, data }) => {
  const sql = await getSql();
  const family = await familyForUser(sql, context.userId, data.familyId);
  if (!family) return { ok: false };
  await sql`update families set name = ${data.name} where id = ${family.id}`;
  return { ok: true };
});
const startCheckout = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
  const { createNidoCheckout } = await import("./stripe");
  return createNidoCheckout(context.userId);
});
const openBillingPortal = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
  const { createNidoPortal } = await import("./stripe");
  return createNidoPortal(context.userId);
});
const listPayments = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ familyId: z.string().optional() }).parse(input ?? {})).handler(async ({ context, data }) => {
  const sql = await getSql();
  const family = await familyForUser(sql, context.userId, data.familyId);
  if (!family) return [];
  const rows = await sql`select id, amount_cents, currency, kind, created_at from payments where family_id = ${family.id} and user_id = ${context.userId} order by created_at desc limit 12`;
  return rows.map((r) => ({
    id: r.id,
    amountCents: r.amount_cents,
    currency: r.currency,
    kind: r.kind,
    createdAt: asIso(r.created_at) ?? ""
  }));
});
const pairDevice = createServerFn({ method: "POST" }).validator(
  (input) => z.object({
    code: z.string().trim().min(6).max(8),
    deviceName: z.string().trim().min(1).max(40),
    localDate: localDateSchema,
    localMinutes: z.number().int()
  }).parse(input)
).handler(async ({ data }) => {
  const sql = await getSql();
  const code = data.code.trim().toUpperCase();
  const rows = await sql`select * from children where pairing_code = ${code} limit 1`;
  const child = rows[0];
  if (!child) throw new Error("C\xF3digo no v\xE1lido.");
  if (child.pairing_expires_at && new Date(child.pairing_expires_at).getTime() < Date.now()) {
    throw new Error("El c\xF3digo caduc\xF3. Pide uno nuevo al tutor.");
  }
  const token = newPairingToken();
  const tokenHash = hashToken(token);
  await sql`update children set pairing_token_hash = ${tokenHash}, pairing_code = null, pairing_expires_at = null, device_name = ${data.deviceName}, last_seen_at = now(), last_heartbeat_at = now() where id = ${child.id}`;
  await logActivity(sql, child.id, child.user_id, "pair", `Dispositivo vinculado: ${data.deviceName}`);
  const session = await sessionFromChild(sql, { ...child, pairing_token_hash: tokenHash, device_name: data.deviceName, pairing_code: null }, data.localDate, data.localMinutes);
  return { token, session };
});
const deviceSession = createServerFn({ method: "POST" }).validator(
  (input) => z.object({ token: z.string().min(16), localDate: localDateSchema, localMinutes: z.number().int() }).parse(input)
).handler(async ({ data }) => {
  const sql = await getSql();
  const found = await childByToken(sql, data.token);
  if (!found) throw new Error("Dispositivo no vinculado.");
  return sessionFromChild(sql, found.child, data.localDate, data.localMinutes);
});
const deviceHeartbeat = createServerFn({ method: "POST" }).validator(
  (input) => z.object({ token: z.string().min(16), localDate: localDateSchema, localMinutes: z.number().int() }).parse(input)
).handler(async ({ data }) => {
  const sql = await getSql();
  const found = await childByToken(sql, data.token);
  if (!found) throw new Error("Dispositivo no vinculado.");
  const child = found.child;
  let added = 0;
  const now = Date.now();
  if (found.kind === "pair" && child.last_heartbeat_at) {
    const gapMs = now - new Date(child.last_heartbeat_at).getTime();
    if (gapMs > 0 && gapMs <= 3 * 60 * 1e3) {
      added = Math.min(120, Math.round(gapMs / 1e3));
    }
  }
  const summary = await summarizeChild(sql, child, data.localDate, data.localMinutes);
  if (summary.locked || found.kind === "preview") added = 0;
  if (added > 0) {
    await sql`insert into usage_days (child_id, user_id, day, seconds) values (${child.id}, ${child.user_id}, ${data.localDate}, ${added})
        on conflict (child_id, day) do update set seconds = usage_days.seconds + excluded.seconds`;
  }
  if (found.kind === "pair") {
    await sql`update children set last_heartbeat_at = now(), last_seen_at = now() where id = ${child.id}`;
  }
  const session = await sessionFromChild(sql, child, data.localDate, data.localMinutes);
  return { session, addedSeconds: added };
});
const deviceClassify = createServerFn({ method: "POST" }).validator((input) => z.object({ token: z.string().min(16), url: z.string().min(1).max(500) }).parse(input)).handler(async ({ data }) => {
  const sql = await getSql();
  const found = await childByToken(sql, data.token);
  if (!found) throw new Error("Dispositivo no vinculado.");
  const child = found.child;
  const flags = await loadFilter(sql, child.id);
  const allowed = await sql`select host from allowed_sites where child_id = ${child.id}`;
  const blocked = await sql`select host from blocked_sites where child_id = ${child.id}`;
  const toggles = await sql`select app_id, allowed from app_toggles where child_id = ${child.id}`;
  const appToggles = {};
  for (const t of toggles) appToggles[t.app_id] = t.allowed;
  const result = classifyUrl(
    data.url,
    flags,
    blocked.map((r) => r.host),
    allowed.map((r) => r.host),
    appToggles
  );
  if (!result.allowed) {
    await logActivity(sql, child.id, child.user_id, "block", `${result.host} \xB7 ${result.reason}`);
  } else if (found.kind === "pair") {
    await logActivity(sql, child.id, child.user_id, "browse", result.host);
  }
  return result;
});
const deviceRequestTime = createServerFn({ method: "POST" }).validator(
  (input) => z.object({ token: z.string().min(16), minutes: z.number().int().min(5).max(60), reason: z.string().max(140).optional() }).parse(input)
).handler(async ({ data }) => {
  const sql = await getSql();
  const found = await childByToken(sql, data.token);
  if (!found) throw new Error("Dispositivo no vinculado.");
  const child = found.child;
  const open = await sql`select count(*)::int as n from time_requests where child_id = ${child.id} and status = 'pending'`;
  if ((open[0]?.n ?? 0) > 0) throw new Error("Ya hay una solicitud en espera.");
  await sql`insert into time_requests (child_id, user_id, minutes, reason) values (${child.id}, ${child.user_id}, ${data.minutes}, ${data.reason ?? null})`;
  await logActivity(sql, child.id, child.user_id, "request", `Pidi\xF3 ${data.minutes} min extra`);
  return { ok: true };
});
const deviceVerifyPin = createServerFn({ method: "POST" }).validator((input) => z.object({ token: z.string().min(16), pin: pinSchema }).parse(input)).handler(async ({ data }) => {
  const sql = await getSql();
  const found = await childByToken(sql, data.token);
  if (!found) throw new Error("Dispositivo no vinculado.");
  const child = found.child;
  const result = await checkPin(child.user_id, data.pin);
  await logActivity(
    sql,
    child.id,
    child.user_id,
    result.ok ? "unlock" : "tamper",
    result.ok ? "PIN correcto en el dispositivo" : "Intento de PIN fallido"
  );
  return result;
});
const deviceReportTamper = createServerFn({ method: "POST" }).validator(
  (input) => z.object({ token: z.string().min(16), detail: z.string().max(200) }).parse(input)
).handler(async ({ data }) => {
  const sql = await getSql();
  const found = await childByToken(sql, data.token);
  if (!found) throw new Error("Dispositivo no vinculado.");
  const child = found.child;
  await logActivity(sql, child.id, child.user_id, "tamper", data.detail);
  return { ok: true };
});
const parentOpenChildDevice = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(
  (input) => z.object({ childId: z.string(), localDate: localDateSchema, localMinutes: z.number().int() }).parse(input)
).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  const token = newPairingToken();
  const tokenHash = hashToken(token);
  await sql`update children set preview_token_hash = ${tokenHash} where id = ${child.id} and user_id = ${context.userId}`;
  const session = await sessionFromChild(sql, child, data.localDate, data.localMinutes);
  return { token, session };
});
const parentClassify = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ childId: z.string(), url: z.string().min(1).max(500) }).parse(input)).handler(async ({ context, data }) => {
  const sql = await getSql();
  const child = await childOwned(sql, context.userId, data.childId);
  if (!child) throw new Error("Perfil no encontrado.");
  const flags = await loadFilter(sql, child.id);
  const allowed = await sql`select host from allowed_sites where child_id = ${child.id}`;
  const blocked = await sql`select host from blocked_sites where child_id = ${child.id}`;
  const toggles = await sql`select app_id, allowed from app_toggles where child_id = ${child.id}`;
  const appToggles = {};
  for (const t of toggles) appToggles[t.app_id] = t.allowed;
  return classifyUrl(
    data.url,
    flags,
    blocked.map((r) => r.host),
    allowed.map((r) => r.host),
    appToggles
  );
});
export {
  addChild,
  addSite,
  changePin,
  createFamily,
  createPairingCode,
  deviceClassify,
  deviceHeartbeat,
  deviceReportTamper,
  deviceRequestTime,
  deviceSession,
  deviceVerifyPin,
  getChildDetail,
  getFamily,
  grantExtraTime,
  revokeExtraTime,
  listPayments,
  openBillingPortal,
  pairDevice,
  parentClassify,
  parentOpenChildDevice,
  removeSite,
  renameFamily,
  respondTimeRequest,
  revokeDevice,
  setAppToggle,
  setChildPaused,
  setDayLimits,
  setSystemGuard,
  startCheckout,
  updateChild,
  updateFilters,
  verifyFamilyPin
};
