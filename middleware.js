/* ------------------------------------------------------------------
 * Vercel Edge Middleware — per-product social link previews.
 *
 * Problem: this site is a client-side React SPA. Social crawlers
 * (WhatsApp, Facebook, X/Twitter, Telegram, Slack, Discord, …) do NOT
 * run JavaScript, so the <Seo /> component's Open Graph tags never
 * reach them — they only see the static index.html, which carries a
 * single generic og:image. That's why a shared product link shows the
 * app name + URL but no product photo.
 *
 * Fix: when a known crawler requests /products/<id>, we fetch the
 * product from the backend and return a tiny HTML document whose <head>
 * contains product-specific og:image / og:title / og:description. Real
 * users (any non-crawler UA) fall straight through to the SPA, so the
 * app behaviour is unchanged.
 *
 * The `matcher` keeps this function from running on anything except
 * product routes, so the cost/latency stays negligible.
 * ------------------------------------------------------------------ */

export const config = {
  matcher: '/products/:path*',
}

const API_BASE = 'https://arusuvaijunctionbackend.onrender.com/arusuvai'
const SITE = 'https://www.arusuvaijunction.com'
const FALLBACK_IMAGE = `${SITE}/og-default.jpg`

// User-agents of link-preview / social / SEO crawlers. Real browsers
// never match these, so humans always get the SPA.
const CRAWLER_RE =
  /(facebookexternalhit|facebookcatalog|WhatsApp|Twitterbot|Slackbot|TelegramBot|LinkedInBot|Discordbot|Pinterest|redditbot|Googlebot|bingbot|embedly|quora link preview|vkShare|W3C_Validator|Skype|flipboard|tumblr|bitlybot|nuzzel|Applebot|SkypeUriPreview|Iframely|Google-InspectionTool)/i

/** Escape a string for safe inclusion in an HTML attribute / text node. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Pick the best product image and make sure it's an absolute URL. */
function resolveImage(product) {
  const raw =
    product.primaryImageUrl ||
    (Array.isArray(product.images) &&
      (product.images[0]?.imageUrl || product.images[0]?.url)) ||
    ''
  if (!raw) return FALLBACK_IMAGE
  if (/^https?:\/\//i.test(raw)) return raw
  return `${SITE}${raw.startsWith('/') ? '' : '/'}${raw}`
}

/** Lowest price across variants, falling back to the product price. */
function resolvePrice(product) {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const prices = variants
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (!prices.length && Number(product.price) > 0) prices.push(Number(product.price))
  return prices.length ? Math.min(...prices) : null
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''

  // Not a crawler → let the SPA handle it (returning nothing continues
  // the request to its normal destination).
  if (!CRAWLER_RE.test(ua)) return

  const url = new URL(request.url)
  const match = url.pathname.match(/^\/products\/([^/]+)\/?$/)
  if (!match) return

  const productId = decodeURIComponent(match[1])
  const pageUrl = `${SITE}/products/${encodeURIComponent(productId)}`

  let product
  try {
    const res = await fetch(
      `${API_BASE}/api/product?productId=${encodeURIComponent(productId)}`,
      { headers: { accept: 'application/json' } },
    )
    if (!res.ok) return
    product = await res.json()
  } catch {
    // Backend unreachable (e.g. cold start) → fall through to the SPA
    // rather than serving a broken preview.
    return
  }
  if (!product || !product.name) return

  const name = product.name
  const title = `${name} | Arusuvai Junction`
  const description =
    String(product.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200) ||
    `Buy ${name} online from Arusuvai Junction — traditional Tamil snacks, sugar-free and preservative-free.`
  const image = resolveImage(product)
  const price = resolvePrice(product)

  const html = `<!doctype html>
<html lang="en-IN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(pageUrl)}" />

    <meta property="og:site_name" content="Arusuvai Junction" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:alt" content="${escapeHtml(name)}" />
    <meta property="og:locale" content="en_IN" />
    ${
      price != null
        ? `<meta property="product:price:amount" content="${escapeHtml(price)}" />
    <meta property="product:price:currency" content="INR" />`
        : ''
    }

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />

    <!-- A human that somehow lands here (rare — gated on crawler UA) is
         sent to the real app. -->
    <meta http-equiv="refresh" content="0; url=${escapeHtml(pageUrl)}" />
  </head>
  <body>
    <a href="${escapeHtml(pageUrl)}">${escapeHtml(name)}</a>
  </body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Cache the preview at the edge for a day; crawlers re-fetch later.
      'cache-control': 'public, max-age=300, s-maxage=86400',
    },
  })
}
