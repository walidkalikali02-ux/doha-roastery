This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Email Confirmation with Resend

The app uses Supabase Auth for email/password accounts. To log users in immediately after registration, disable `Confirm email` in `Authentication > Providers > Email`.

If email confirmation is required, configure Resend as the Supabase Auth SMTP provider:

1. In Supabase, open `Authentication > Email > SMTP Settings` and enable custom SMTP.
2. Use host `smtp.resend.com`, port `465`, username `resend`, and the Resend API key as the password.
3. Use the verified sender from `RESEND_FROM_EMAIL`.
4. In the confirmation email template, use `{{ .ConfirmationURL }}`.

Supabase Auth stores the account and manages the session; Resend only delivers the confirmation email.

## Order notifications

- Checkout creates orders through `/api/orders`, which schedules customer and admin
  emails on the server using Next.js `after`. Both COD and card orders are notified
  immediately; unpaid card orders explicitly say **awaiting payment**.
- Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `STORE_OWNER_EMAIL` in the
  deployment. The sender domain must be verified in Resend.
- Each recipient is tracked separately, only after Resend accepts the message.
  Transient failures are retried three times. Stable Resend idempotency keys
  protect concurrent checkout, payment callback, webhook, and recovery sends
  during Resend's 24-hour idempotency window.
- Set a strong random `CRON_SECRET` in Vercel **production**, then deploy with
  `vercel.json`. Vercel calls `/api/cron/order-emails` every five minutes (Pro plan)
  with `Authorization: Bearer <CRON_SECRET>`. It recovers missing notifications
  for active orders from the last seven days, up to 20 per run. Set
  `ORDER_EMAIL_RECOVERY_SINCE` to the rollout's ISO timestamp to keep retrying all
  subsequent orders without a seven-day cutoff. Repeated failures return HTTP
  503 and are logged with the order ID. Legacy orders need manual review.
- Payment callbacks and webhooks also recover missing recipients. A verified
  payment webhook returns HTTP 503 on notification failure to allow redelivery.
- `node --env-file=.env.local scripts/send-order-email.mjs <order_number>` is an
  explicit **force resend** to both recipients. Use only when a resend is intended.

Notification timestamps mean the provider accepted the message, not that it
reached the inbox. Check Resend's delivery events for bounces or spam complaints.

## Live product editing and checkout

- Auth profile loading happens outside `onAuthStateChange`, avoiding the Supabase
  auth-lock deadlock that can stall checkout and admin saves.
- `/admin/products` loads current data through an authenticated server endpoint,
  rather than a build-time snapshot. Writes validate fields, verify the admin's
  current role, update only edited fields, and invalidate storefront caches.
  Concurrent edits return HTTP 409 instead of overwriting newer changes.
- Public catalog pages read live data with `no-store` and display only active
  products. Open storefront tabs refresh on focus, after local admin saves, and
  every minute while visible.
- Saved carts refresh product prices, names, images, options, and availability.
  Checkout rechecks prices and stock before creating an order and uses the
  contact email explicitly entered by the customer, including signed-in users.
- Order details in admin show independent customer/admin email acceptance and
  allow retrying unrecorded notifications. Already-recorded recipients are skipped.

Run `npm test` for delivery/catalog regression tests. Run `npx playwright install
chromium` once, then `npm run test:e2e` for mocked browser checkout/admin flows.
Browser tests never create real orders or modify live products.

## Google Login

Enable Google under `Authentication > Providers > Google` in Supabase. Add the Supabase callback URL to Google Cloud OAuth credentials:

```text
https://lcjkjukqjjfaljndhgji.supabase.co/auth/v1/callback
```

Add `https://www.doharoastery.com/auth/callback` to Supabase's allowed redirect URLs.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
