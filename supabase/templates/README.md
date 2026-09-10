# Supabase Email Templates

Branded email templates for Ripple Finance auth flows.

## Install the Reset Password template

1. Open **Supabase Dashboard → Authentication → Emails**
2. Find the **"Reset Password"** template → click **Edit**
3. Open `reset-password.html` in this folder, copy the entire file contents
4. Paste into the template editor → **Save**

### Variables you can use

| Variable | What it is |
|---|---|
| `{{ .ConfirmationURL }}` | Magic link that lands on `/reset-password` (respects your `redirectTo`) |
| `{{ .Token }}` | 6-digit OTP, if you switch to code-based entry |
| `{{ .Email }}` | Recipient address |
| `{{ .SiteURL }}` | Your configured Site URL |

### Before saving — two things to customize

1. **Logo URL** — the template references `https://your-domain.com/ripple-logo.png`.
   Replace with a hosted copy of `src/assets/ripple.png` (any public URL works;
   email clients won't load local assets).
2. **Domain in the footer/links** — links use `{{ .ConfirmationURL }}` so they
   follow your Supabase **Site URL** automatically.

### Requirements checklist

- **Auth → URL Configuration → Site URL** = your production URL
- **Redirect URLs** includes `https://<your-domain>/reset-password`
  (and `http://localhost:5173/reset-password` for dev)
- If your Supabase project is on the free plan, emails come from the built-in
  sender with a ~2/hour rate limit — fine for testing, add custom SMTP
  (Auth → SMTP) before real traffic.
