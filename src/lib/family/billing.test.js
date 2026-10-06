import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extendPaidUntil, PLAN_PRICE_CENTS, resolvePlan } from "./billing.js";
describe("resolvePlan", () => {
  it("uses trial while it lasts", () => {
    const now = Date.parse("2026-03-01T12:00:00Z");
    const plan = resolvePlan("2026-03-20T12:00:00Z", null, now);
    assert.equal(plan.status, "trial");
    assert.equal(plan.daysLeft, 19);
    assert.equal(plan.priceLabel, "$3.99");
  });
  it("prefers a paid month over trial", () => {
    const now = Date.parse("2026-03-01T12:00:00Z");
    const plan = resolvePlan("2026-03-20T12:00:00Z", "2026-04-01T12:00:00Z", now);
    assert.equal(plan.status, "active");
  });
  it("expires when both dates are past", () => {
    const now = Date.parse("2026-05-01T12:00:00Z");
    const plan = resolvePlan("2026-03-20T12:00:00Z", "2026-04-01T12:00:00Z", now);
    assert.equal(plan.status, "expired");
    assert.equal(plan.daysLeft, 0);
  });
});
describe("extendPaidUntil", () => {
  it("adds 30 days from now if unpaid", () => {
    const now = Date.parse("2026-03-01T00:00:00Z");
    assert.equal(extendPaidUntil(null, now), "2026-03-31T00:00:00.000Z");
  });
  it("charges 399 usd cents", () => {
    assert.equal(PLAN_PRICE_CENTS, 399);
  });
});
