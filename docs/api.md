# dann-tele API

All protected requests use the Better Auth session cookie. Never send Telegram bot tokens to the browser after creation.

## Authentication

- `POST /api/auth/sign-up/email` — create an account and send verification email.
- `POST /api/auth/sign-in/email` — sign in with email and password.
- `GET|POST /api/auth/sign-in/social` — start Google or GitHub OAuth.
- `GET /api/auth/get-session` — return the current session.
- `POST /api/auth/sign-out` — revoke the current session.

## Bots

- `GET /api/bots` — list bots owned by the current user.
- `POST /api/bots` — create a bot with `{ "name": string, "token": string }`.
- `GET /api/bots/:botId` — read an owned bot.
- `DELETE /api/bots/:botId` — delete an owned bot and its logs.
- `POST /api/bots/validate` — validate an owned bot against Telegram `getMe`.
- `POST /api/telegram/webhook/:botId` — Telegram webhook receiver.
  Webhooks are accepted only when Telegram sends the per-bot `X-Telegram-Bot-Api-Secret-Token` header configured by the start lifecycle endpoint.

## Profile and media

- `POST /api/profile/avatar` — upload a private image (`multipart/form-data`, field `file`, max 5MB).
- `GET /api/profile/avatar/file?pathname=...` — authenticated avatar delivery with ETag support.

## Required environment

`MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `RESEND_API_KEY`, `RESEND_EMAIL_DOMAIN`, and `BLOB_READ_WRITE_TOKEN`.

## Security notes

All user-owned queries must scope by the Better Auth user id. Telegram tokens and webhook secrets are stored server-side only. OAuth secrets, Resend keys, and Blob tokens must remain server environment variables. New bots start stopped and must be explicitly started before updates are processed.
