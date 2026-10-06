const PLAN_PRICE_CENTS = 399;
const PLAN_CURRENCY = "usd";
const PLAN_PRICE_LABEL = "$3.99";
const PLAN_PERIOD_DAYS = 30;
const TRIAL_DAYS = 30;
function trialEndsFrom(created = /* @__PURE__ */ new Date()) {
  return new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1e3).toISOString();
}
function resolvePlan(trialEndsAt, paidUntil, now = Date.now()) {
  const paid = paidUntil ? new Date(paidUntil).getTime() : 0;
  const trial = trialEndsAt ? new Date(trialEndsAt).getTime() : 0;
  let status = "expired";
  let until = null;
  if (paid > now) {
    status = "active";
    until = new Date(paid).toISOString();
  } else if (trial > now) {
    status = "trial";
    until = new Date(trial).toISOString();
  } else if (paid > 0) {
    until = new Date(paid).toISOString();
  } else if (trial > 0) {
    until = new Date(trial).toISOString();
  }
  const end = until ? new Date(until).getTime() : 0;
  const daysLeft = end > now ? Math.ceil((end - now) / (24 * 60 * 60 * 1e3)) : 0;
  return { status, until, daysLeft, priceLabel: PLAN_PRICE_LABEL };
}
function extendPaidUntil(currentPaidUntil, now = Date.now()) {
  const base = Math.max(now, currentPaidUntil ? new Date(currentPaidUntil).getTime() : 0);
  return new Date(base + PLAN_PERIOD_DAYS * 24 * 60 * 60 * 1e3).toISOString();
}
function planHeadline(plan) {
  if (plan.status === "trial") {
    return plan.daysLeft === 1 ? "Queda 1 d\xEDa de prueba" : `Quedan ${plan.daysLeft} d\xEDas de prueba`;
  }
  if (plan.status === "active") {
    return plan.daysLeft === 1 ? "Plan activo \xB7 1 d\xEDa" : `Plan activo \xB7 ${plan.daysLeft} d\xEDas`;
  }
  return "La prueba termin\xF3";
}
export {
  PLAN_CURRENCY,
  PLAN_PERIOD_DAYS,
  PLAN_PRICE_CENTS,
  PLAN_PRICE_LABEL,
  TRIAL_DAYS,
  extendPaidUntil,
  planHeadline,
  resolvePlan,
  trialEndsFrom
};
