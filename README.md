# Telegram Preview Proxy

A Vercel serverless function that emits robust Open Graph / Twitter Card metadata for Telegram/Discord unfurls, then optionally redirects humans to a destination URL.

## Why this exists

Some links either:
- redirect too quickly for crawlers to parse HTML,
- miss OG/Twitter tags,
- have unsafe/unescaped query values,
- or serve metadata inconsistently.

This endpoint lets you provide clean, deterministic metadata while still forwarding users to the real destination.

## Usage

```text
https://<VERCEL_URL>/api?title=My%20Title&desc=Short%20summary&image=https%3A%2F%2Fexample.com%2Fcover.jpg&url=https%3A%2F%2Fdestination.com
```

## Query params

- `title` (optional): preview title, clamped to 120 chars
- `desc` (optional): preview description, clamped to 300 chars
- `image` (optional): absolute `http(s)` image URL
- `url` (optional): absolute `http(s)` destination URL
- `redirect` (optional): `delayed` (default), `immediate`, or `none`
- `delay_ms` (optional): redirect delay in milliseconds when `redirect=delayed` (default `1500`, min `0`, max `10000`)

## Behavior

- Escapes all user-controlled strings before placing into HTML/meta attributes.
- Rejects non-HTTP(S) URLs for `image` and `url`.
- Emits comprehensive OG + Twitter tags.
- Emits canonical URL based on the proxy request URL (`og:url` + `<link rel="canonical">`) for consistency.
- Uses delayed client-side redirect by default to allow crawler parse time.
- Includes `<noscript>` meta refresh fallback.
- Adds baseline security headers (`nosniff`, frame deny, permissions policy).
- Uses CDN caching (`public, s-maxage=21600, stale-while-revalidate=86400`).

## Notes for unfurl reliability

- Telegram/Discord unfurls are crawler-dependent and may be cached; changing metadata might not re-unfurl immediately for an already-posted URL.
- If no image is provided, cards may still unfurl but usually as a smaller text-only card.
- Keep query strings reasonably sized; extremely long encoded payloads can fail in clients/proxies.

## Tests

```bash
npm test
```
