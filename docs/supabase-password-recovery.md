# Supabase password recovery setup

The client portal uses an email OTP recovery flow to avoid single-use confirmation links being consumed by email security scanners.

## 1. Supabase redirect URL allow list

In Supabase Dashboard, open **Authentication → URL Configuration**.

Keep the production Site URL set to the canonical production domain. Add these redirect patterns (adjust the project/team slug if Vercel changes it):

- `https://unihost.co.ke/**`
- `https://*-rashidnjoroge7-2764s-projects.vercel.app/**`
- `http://localhost:3000/**`

The application passes the current origin with `redirectTo`, so Preview emails return to the exact Preview deployment that requested the reset. The wildcard is needed because Vercel Preview deployment hostnames change.

## 2. Supabase Reset Password email template

Open **Authentication → Email Templates → Reset Password**.

Subject:

`Your client portal password recovery code`

Replace the body with:

```html
<h2>Reset your password</h2>

<p>We received a request to reset your client portal password.</p>

<p>Enter this eight-digit code on the password reset page:</p>

<p style="font-size: 30px; font-weight: 700; letter-spacing: 8px; padding: 12px 0;">
  {{ .Token }}
</p>

<p>
  <a href="{{ .RedirectTo }}">Open password reset page</a>
</p>

<p>
  This code can only be used once. Do not share it with anyone.
  If you did not request a password reset, you can ignore this email.
</p>
```

**Important:** Do not include `{{ .ConfirmationURL }}` or a URL containing `{{ .TokenHash }}` in this recovery template. The email link should only open the app page; the user must manually enter the eight-digit code. This prevents automated email link scanners from consuming the recovery token.

## 3. Expected recovery flow

1. User opens **Client Portal → Forgot your password**.
2. User submits their email address.
3. Supabase sends the eight-digit recovery code.
4. User opens the reset page and enters their email, code, and new password.
5. The application calls `supabase.auth.verifyOtp({ email, token, type: "recovery" })`.
6. After OTP verification, the application calls `supabase.auth.updateUser({ password })`.

The first-time activation flow is separate: invitation/magic-link callback → `/client/set-password`. It continues to use the authenticated session created by the activation callback.

## 4. Testing checklist

- Request a recovery code for a known client account.
- Verify the email contains an eight-digit code and links only to the reset page.
- Open the email on a client with link scanning enabled; the code must remain usable.
- Submit the code and a new password.
- Confirm login succeeds with the new password and fails with the old one.
- Confirm an incorrect, expired, or previously used code is rejected.
- Check Supabase Auth logs for a successful recovery OTP verification and password update.

Supabase documentation:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/reference/javascript/auth-verifyotp
