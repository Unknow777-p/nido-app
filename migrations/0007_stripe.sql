-- Stripe ids so a family keeps the same customer across months.

alter table families add column if not exists stripe_customer_id text;
alter table families add column if not exists stripe_subscription_id text;
