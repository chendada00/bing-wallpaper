
import { mkdir, writeFile } from 'node:fs/promises'
import { loadSourceDataset, SOURCE_SHA } from './data-source.mjs'
import { loadEnv } from 'vite'

const fileEnv = loadEnv(
  'production',
  process.cwd(),
  'VITE_'
)

const SITE_URL = (
  process.env.VITE_SITE_URL ||
  fileEnv.VITE_SITE_URL ||
  'https://bing.伴随.cn'
).replace(/\/+$/, '')

if (!SITE_URL) {
  throw new Error('VITE_SITE_URL is required when generating sitemap.')
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

async function main() {
  const { index, dates } = await loadSourceDataset()

  const urls = [
    {
      loc: `${SITE_URL}/`,
      lastmod: index.updatedAt
        ? String(index.updatedAt).slice(0, 10)
        : ''
    },
    ...dates.map(date => ({
      loc: `${SITE_URL}/wallpaper/${date}`,
      lastmod: date
    }))
  ]

  const sitemapEntries = urls.map(item => {
    const lastmod = item.lastmod
      ? `\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>`
      : ''

    return `
    <url>
      <loc>${escapeXml(item.loc)}</loc>${lastmod}
    </url>`
  }).join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries}
</urlset>
`

  await mkdir('public', { recursive: true })
  await writeFile('public/sitemap.xml', sitemap, 'utf8')

  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    ''
  ].join('\n')

  await writeFile('public/robots.txt', robots, 'utf8')

  console.log(`Sitemap 数据版本：${SOURCE_SHA}`)
  console.log(`Sitemap 生成完成：${urls.length} 个 URL`)
}

main().catch(error => {
  console.error('生成 Sitemap 失败：')
  console.error(error)
  process.exitCode = 1
})
