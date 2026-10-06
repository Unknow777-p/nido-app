import Stripe from "stripe";
import { publicOrigin } from "./rpc";
import { getSql } from "./lib/db";
import { extendPaidUntil, PLAN_CURRENCY, PLAN_PRICE_CENTS } from "@/lib/family/billing";
function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("Stripe no est\xE1 configurado.");
  return new Stripe(key);
}
async function createNidoPortal(userId) {
  if (!isStripeConfigured()) return { ok: false, reason: "not_configured" };
  const sql = await getSql();
  const families = await sql`select id, stripe_customer_id from families where user_id = ${userId} limit 1`;
  const family = families[0];
  if (!family?.stripe_customer_id) return { ok: false, reason: "no_family" };
  const origin = publicOrigin();
  const stripe = stripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: family.stripe_customer_id,
    return_url: `${origin}/app/ajustes`
  });
  if (!session.url) return { ok: false, reason: "no_url" };
  return { ok: true, url: session.url };
}
async function createNidoCheckout(userId) {
  if (!isStripeConfigured()) return { ok: false, reason: "not_configured" };
  const sql = await getSql();
  const families = await sql`select id, stripe_customer_id from families where user_id = ${userId} limit 1`;
  const family = families[0];
  if (!family) return { ok: false, reason: "no_family" };
  const users = await sql`select email from "user" where id = ${userId} limit 1`;
  const email = users[0]?.email?.trim() || void 0;
  const origin = publicOrigin();
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: family.id,
    customer: family.stripe_customer_id || void 0,
    customer_email: family.stripe_customer_id ? void 0 : email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PLAN_CURRENCY,
          unit_amount: PLAN_PRICE_CENTS,
          recurring: { interval: "month" },
          product_data: {
            name: "Nido familiar",
            description: "Tiempo de pantalla, filtros y vigilancia desde el tel\xE9fono del tutor."
          }
        }
      }
    ],
    metadata: { familyId: family.id, userId },
    subscription_data: { metadata: { familyId: family.id, userId } },
    success_url: `${origin}/app/ajustes?paid=1`,
    cancel_url: `${origin}/app/ajustes?paid=0`
  });
  if (!session.url) return { ok: false, reason: "no_url" };
  return { ok: true, url: session.url };
}
function periodEndIso(sub) {
  const end = sub.items.data[0]?.current_period_end;
  if (end) return new Date(end * 1e3).toISOString();
  return extendPaidUntil(null);
}
function idOf(value) {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id;
  }
  return void 0;
}
function invoiceSubscription(invoice) {
  const details = invoice.parent?.subscription_details;
  return {
    id: idOf(details?.subscription),
    metadata: details?.metadata ?? invoice.metadata
  };
}
async function applyStripePeriod(opts) {
  const sql = await getSql();
  let family;
  if (opts.familyId) {
    const rows = await sql`select id, user_id from families where id = ${opts.familyId} limit 1`;
    family = rows[0];
  }
  if (!family && opts.customerId) {
    const rows = await sql`select id, user_id from families where stripe_customer_id = ${opts.customerId} limit 1`;
    family = rows[0];
  }
  if (!family) return;
  await sql`update families set paid_until = ${opts.paidUntil},
    stripe_customer_id = coalesce(${opts.customerId}, stripe_customer_id),
    stripe_subscription_id = coalesce(${opts.subscriptionId}, stripe_subscription_id)
    where id = ${family.id}`;
  await sql`insert into payments (family_id, user_id, amount_cents, currency, kind)
    values (${family.id}, ${opts.userId ?? family.user_id}, ${PLAN_PRICE_CENTS}, ${PLAN_CURRENCY}, ${"month"})`;
}
async function expireStripeFamily(customerId) {
  const sql = await getSql();
  await sql`update families set paid_until = ${(/* @__PURE__ */ new Date()).toISOString()} where stripe_customer_id = ${customerId}`;
}
async function handleStripeWebhook(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret || !key) {
    return new Response("Stripe no est\xE1 configurado.", { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Falta la firma.", { status: 400 });
  const raw = await request.text();
  const stripe = new Stripe(key);
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return new Response("Firma no v\xE1lida.", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const familyId = session.metadata?.familyId ?? session.client_reference_id;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    let paidUntil = extendPaidUntil(null);
    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      paidUntil = periodEndIso(sub);
    }
    await applyStripePeriod({
      familyId,
      customerId,
      subscriptionId,
      paidUntil,
      userId: session.metadata?.userId
    });
  }
  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    const fromInvoice = invoiceSubscription(invoice);
    let familyId = fromInvoice.metadata?.familyId;
    let subscriptionId = fromInvoice.id;
    let paidUntil = extendPaidUntil(null);
    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      familyId = familyId ?? sub.metadata?.familyId;
      paidUntil = periodEndIso(sub);
    }
    await applyStripePeriod({
      familyId,
      customerId,
      subscriptionId,
      paidUntil,
      userId: fromInvoice.metadata?.userId
    });
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (customerId) await expireStripeFamily(customerId);
  }
  return new Response("ok", { status: 200 });
}
export {
  applyStripePeriod,
  createNidoCheckout,
  createNidoPortal,
  expireStripeFamily,
  handleStripeWebhook,
  isStripeConfigured
};
