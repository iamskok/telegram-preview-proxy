# Preview Reliability Report — 2026-02-24

## Scope

Audited and improved:
- `api/index.ts`
- `README.md`

Goal: improve Telegram/Discord unfurl reliability for proxy-generated previews.

---

## Root causes found in original implementation

1. **Unsafe interpolation (escaping issue)**
   - `title`, `desc`, `image`, and `url` were injected directly into HTML and meta attributes.
   - Risk: broken markup or tag truncation when input contains quotes/special chars.

2. **Redirect timing too aggressive for crawlers**
   - Immediate JS redirect + `meta refresh` at 0s.
   - Some crawlers can miss metadata when redirect executes too quickly.

3. **Weak URL validation**
   - Any string was accepted for `image`/`url`.
   - Invalid/non-http URLs can break tags and redirect behavior.

4. **Limited metadata coverage**
   - Basic OG/Twitter tags existed, but no canonical link, no `og:site_name`, no locale.

5. **Potential canonical mismatch**
   - `og:url` used destination URL, while HTML is actually served by proxy URL.
   - Can cause inconsistent canonical identity for crawlers.

6. **Cache policy simplistic**
   - `s-maxage=86400` only, no stale policy.
   - Not wrong, but less resilient under cache churn.

7. **Missing security headers**
   - No `X-Content-Type-Options`, `X-Frame-Options`, etc.

8. **No explicit robots policy**
   - Not always required, but explicit `index,follow` helps avoid accidental noindex edge cases in future edits.

---

## Fixes implemented

### Code hardening (`api/index.ts`)

- Added strict escaping helper for HTML/meta attribute safety.
- Added URL parser that only allows valid `http(s)` URLs.
- Added text clamping:
  - title max 120 chars
  - description max 300 chars
- Added robust redirect controls:
  - `redirect=delayed` (default)
  - `redirect=immediate`
  - `redirect=none`
  - `delay_ms` configurable, bounded `0..10000` (default `1500`)
- Implemented JS redirect using `JSON.stringify` target injection (safe script embedding).
- Added `<noscript>` fallback refresh with delay support.

### Metadata improvements

- OG: `title`, `description`, `type`, `url`, `image`, `image:alt`, `site_name`, `locale`
- Twitter: card (`summary` if no image, else `summary_large_image`), title, description, image
- Canonical link now emitted and aligned with the served proxy URL.
- Added `robots` meta: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`.

### Response headers and caching

- `Content-Type: text/html; charset=utf-8`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer-when-downgrade`
- `X-Frame-Options: DENY`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- Updated cache policy:
  - `Cache-Control: public, s-maxage=21600, stale-while-revalidate=86400`

---

## Local test matrix (expected behavior)

> Base endpoint used below: `https://<VERCEL_URL>/api`

### A) Good source URL with image (should unfurl large)

Proxy URL:

```text
https://<VERCEL_URL>/api?title=OpenAI%20News&desc=Latest%20announcements&image=https%3A%2F%2Fimages.example.com%2Fcover.jpg&url=https%3A%2F%2Fopenai.com%2Fnews
```

Expected:
- Telegram/Discord generate card with title + desc + large image.
- Human click redirects after ~1.5s.

### B) URL without image (should unfurl text card)

```text
https://<VERCEL_URL>/api?title=Text%20Only&desc=No%20image%20provided&url=https%3A%2F%2Fexample.com
```

Expected:
- Unfurl still appears (title + desc), often compact/smaller card.
- Twitter card type becomes `summary`.

### C) Immediate redirect mode (higher crawler risk)

```text
https://<VERCEL_URL>/api?title=Fast%20Redirect&desc=May%20reduce%20crawler%20parse%20time&url=https%3A%2F%2Fexample.com&redirect=immediate
```

Expected:
- Humans redirected instantly.
- Some crawler environments may be less reliable than delayed mode.

### D) Delayed redirect with explicit delay (recommended)

```text
https://<VERCEL_URL>/api?title=Delayed%20Redirect&desc=Crawler-friendly&url=https%3A%2F%2Fexample.com&redirect=delayed&delay_ms=2500
```

Expected:
- Metadata parse window is larger.
- Better unfurl reliability in clients that execute/observe redirect behavior aggressively.

### E) Redirect disabled (diagnostic mode)

```text
https://<VERCEL_URL>/api?title=No%20Redirect&desc=Debug%20metadata%20only&url=https%3A%2F%2Fexample.com&redirect=none
```

Expected:
- No auto-forward; useful for inspecting raw metadata.
- Unfurl should reflect provided tags.

### F) Invalid URL input (should not redirect)

```text
https://<VERCEL_URL>/api?title=Bad%20URL&desc=Invalid%20destination&url=javascript%3Aalert(1)
```

Expected:
- Invalid URL rejected by parser.
- Page shows “No valid destination URL was provided.”
- Prevents unsafe redirect behavior.

---

## Practical caveats

- Telegram/Discord cache previews; reposting the exact same URL may keep old metadata for some time.
- Very long query strings can still fail at network/client limits; keep payload concise.
- If the image URL is slow/blocked/non-public, unfurl may degrade even with correct tags.

---

## Changed files

1. `/Users/vladimir/.openclaw/workspace/telegram-preview-proxy/api/index.ts`
2. `/Users/vladimir/.openclaw/workspace/telegram-preview-proxy/README.md`
3. `/Users/vladimir/.openclaw/workspace/telegram-preview-proxy/PREVIEW-RELIABILITY-REPORT-2026-02-24.md`
