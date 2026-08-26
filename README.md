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
