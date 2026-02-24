export default function handler(req: any, res: any) {
  const { title, desc, image, url } = req.query;

  const safeTitle = typeof title === 'string' ? title : 'Generic Preview';
  const safeDesc = typeof desc === 'string' ? desc : 'Check out this link!';
  const safeImage = typeof image === 'string' ? image : '';
  const safeUrl = typeof url === 'string' ? url : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    ${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ''}
    ${safeUrl ? `<meta property="og:url" content="${safeUrl}" />` : ''}
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    ${safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : ''}
    ${safeUrl ? `<script>window.location.replace("${safeUrl}");</script>
    <noscript><meta http-equiv="refresh" content="0;url=${safeUrl}"></noscript>` : ''}
    <style>
      body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; color: #333; }
      a { color: #0070f3; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>${safeTitle}</h1>
    <p>${safeDesc}</p>
    ${safeUrl ? `<p>Redirecting you to <a href="${safeUrl}">${safeUrl}</a>...</p>` : '<p>No redirect URL provided.</p>'}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-maxage=86400');
  res.status(200).send(html);
}
