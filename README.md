# Telegram Preview Proxy

Generic Vercel serverless function that generates Open Graph / Twitter Card tags for Telegram previews and then redirects the user to the real URL.

## Usage

```
https://<VERCEL_URL>/api?title=My%20Title&desc=Short%20summary&image=https://...&url=https://destination.com
```

## Architecture

- Vercel Node Function: `api/index.ts`
- Uses query params to build OG tags.
- Uses JS redirect + meta refresh to forward the user.
- Cached with `Cache-Control: s-maxage=86400`.

## Tests

```
npm test
```
