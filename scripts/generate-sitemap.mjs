import {
    mkdir,
    writeFile
  } from 'node:fs/promises'
  
  
  const SITE_URL =
    (
      process.env.VITE_SITE_URL ||
      'https://bing.伴随.cn'
    ).replace(/\/$/, '')
  
  
  const DATA_BASE_URL =
    (
      process.env.VITE_DATA_BASE_URL ||
      'https://bing-data.伴随.cn'
    ).replace(/\/$/, '')
  
  
  if (!SITE_URL) {
  
    throw new Error(
      'VITE_SITE_URL is required when generating sitemap.'
    )
  
  }
  
  
  const indexUrl =
    `${DATA_BASE_URL}/data/index.json`
  
  
  console.log(
    `Loading wallpaper index: ${indexUrl}`
  )
  
  
  const response =
    await fetch(indexUrl)
  
  
  if (!response.ok) {
  
    throw new Error(
      `Failed to load wallpaper index: HTTP ${response.status}`
    )
  
  }
  
  
  const data =
    await response.json()
  
  
  const items =
    Array.isArray(data.items)
      ? data.items
      : []
  
  
  const validItems =
    items.filter(item => {
  
      const date = item?.[0]
  
      return /^\d{4}-\d{2}-\d{2}$/
        .test(date)
  
    })
  
  
  const escapeXml =
    value =>
      String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')
  
  
  const urls = [
    {
      loc: `${SITE_URL}/`,
      lastmod: data.updatedAt
        ? data.updatedAt.slice(0, 10)
        : ''
    },
  
    ...validItems.map(item => ({
      loc:
        `${SITE_URL}/wallpaper/${item[0]}`,
  
      lastmod:
        item[0]
    }))
  ]
  
  
  const sitemapEntries =
    urls.map(item => {
  
      const lastmod =
        item.lastmod
          ? `\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>`
          : ''
  
      return `
    <url>
      <loc>${escapeXml(item.loc)}</loc>${lastmod}
    </url>`
  
    }).join('')
  
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  >${sitemapEntries}
  </urlset>
  `
  
  
  await mkdir(
    'public',
    { recursive: true }
  )
  
  
  await writeFile(
    'public/sitemap.xml',
    sitemap,
    'utf8'
  )
  
  
  const robots = `User-agent: *
  Allow: /
  
  Sitemap: ${SITE_URL}/sitemap.xml
  `
  
  
  await writeFile(
    'public/robots.txt',
    robots,
    'utf8'
  )
  
  
  console.log(
    `Generated sitemap with ${urls.length} URLs`
  )
