# Enable real sign-in

Status: frontend prepared; no Supabase account/project has been connected or modified yet.

Connect Supabase in Codex so the project can be inspected before configuration. Alternatively provide only the project's HTTPS URL and public publishable key. Do not provide a password, personal access token, database password, secret key or service-role key in chat.

For the target project:

1. Enable Email under Authentication → Sign In / Providers and allow signups for this open marketplace.
2. Set Site URL to `http://127.0.0.1:5173/` for local testing. Use the real HTTPS origin after deployment.
3. Configure the Magic Link email template to show `{{ .Token }}`. This application verifies an email code, not a clicked magic link. For a newly created account also check the Confirm Signup template includes the token.
4. Configure custom SMTP for sign-in emails to general customers. Supabase's built-in email delivery is restricted and rate limited; use an allowed team email for initial testing rather than assuming arbitrary addresses can receive codes.
5. Put the project URL and public key in `config.js`. Never disable RLS to fix a sign-in problem.
6. Apply the booking migration only after inspecting the target database for existing tables. Auth itself does not require the custom booking tables, but business discovery and bookings do.
7. With a user-provided test email, request one code, verify it, reload, sign out, and sign in again. Do not mark email delivery verified until the user actually receives the email and verifies the code. Test token refresh separately.

The app has frontend tests for correct publishable-key headers, secret-key rejection, configuration errors and empty sign-out responses. These do not replace a real Supabase sign-in test.

Official references: [passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [email rate limits](https://supabase.com/docs/guides/auth/rate-limits).
