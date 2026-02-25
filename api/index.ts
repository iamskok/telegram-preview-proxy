function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function clampText(value: unknown, fallback: string, maxLength: number): string {
  const raw = typeof value === 'string' && value.trim() ? value.trim() : fallback;
  return raw.length > maxLength ? `${raw.slice(0, maxLength - 1)}…` : raw;
}

function parseRedirectMode(value: unknown): 'none' | 'immediate' | 'delayed' {
  if (value === 'none' || value === 'immediate' || value === 'delayed') return value;
  return 'delayed';
}

function parseDelayMs(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1500;
  return Math.max(0, Math.min(10000, Math.round(n)));
}

function getAbsoluteRequestUrl(req: any): string | null {
  const host = (req.headers?.['x-forwarded-host'] || req.headers?.host || '').toString();
  if (!host) return null;

  const forwardedProto = (req.headers?.['x-forwarded-proto'] || '').toString().split(',')[0]?.trim();
  const proto = forwardedProto || 'https';
  const path = typeof req.url === 'string' ? req.url : '/api';

  try {
    return new URL(path, `${proto}://${host}`).toString();
  } catch {
    return null;
  }
}

export default function handler(req: any, res: any) {
  const safeTitle = clampText(req.query?.title, 'Generic Preview', 120);
  const safeDesc = clampText(req.query?.desc, 'Check out this link!', 300);
  const safeImage = parseHttpUrl(req.query?.image);
  const destinationUrl = parseHttpUrl(req.query?.url);

  const redirectMode = parseRedirectMode(req.query?.redirect);
  const delayMs = parseDelayMs(req.query?.delay_ms);
  const delaySeconds = Math.max(0, Math.ceil(delayMs / 1000));

  const requestUrl = getAbsoluteRequestUrl(req);
  const ogUrl = requestUrl || destinationUrl || '';

  const escapedTitle = escapeHtml(safeTitle);
  const escapedDesc = escapeHtml(safeDesc);
  const escapedImage = safeImage ? escapeHtml(safeImage) : '';
  const escapedOgUrl = ogUrl ? escapeHtml(ogUrl) : '';
  const escapedDestination = destinationUrl ? escapeHtml(destinationUrl) : '';

  const twitterCard = safeImage ? 'summary_large_image' : 'summary';

  const shouldRedirect = Boolean(destinationUrl) && redirectMode !== 'none';

  const redirectScript = shouldRedirect
    ? `<script>
      (function() {
        var target = ${JSON.stringify(destinationUrl)};
        var mode = ${JSON.stringify(redirectMode)};
        var delayMs = ${JSON.stringify(delayMs)};
        if (!target) return;
        if (mode === 'immediate') {
          window.location.replace(target);
          return;
        }
        window.setTimeout(function() {
          window.location.replace(target);
        }, delayMs);
      })();
    </script>`
    : '';

  const noScriptRedirect = shouldRedirect
    ? `<noscript><meta http-equiv="refresh" content="${redirectMode === 'immediate' ? 0 : delaySeconds};url=${escapedDestination}"></noscript>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>

  <meta property="og:title" content="${escapedTitle}" />
  <meta property="og:description" content="${escapedDesc}" />
  <meta property="og:type" content="website" />
  ${escapedOgUrl ? `<meta property="og:url" content="${escapedOgUrl}" />` : ''}
  ${escapedImage ? `<meta property="og:image" content="${escapedImage}" />` : ''}
  ${escapedImage ? '<meta property="og:image:alt" content="Preview image" />' : ''}
  <meta property="og:site_name" content="Preview Proxy" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="${twitterCard}" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDesc}" />
  ${escapedImage ? `<meta name="twitter:image" content="${escapedImage}" />` : ''}

  ${escapedOgUrl ? `<link rel="canonical" href="${escapedOgUrl}" />` : ''}
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />

  ${redirectScript}
  ${noScriptRedirect}

  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 720px; margin: 0 auto; color: #1f2937; }
    h1 { margin-bottom: 0.5rem; }
    p { line-height: 1.5; }
    a { color: #0a66c2; text-decoration: none; word-break: break-word; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <p>${escapedDesc}</p>
  ${destinationUrl ? `<p>${redirectMode === 'none' ? 'Destination:' : 'Redirecting you to'} <a href="${escapedDestination}" rel="noopener noreferrer">${escapedDestination}</a>${redirectMode === 'delayed' ? ` in ~${delaySeconds}s` : ''}.</p>` : '<p>No valid destination URL was provided.</p>'}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');

  res.status(200).send(html);
}
