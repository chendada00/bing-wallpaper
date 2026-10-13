import {
  mkdir,
  readdir,
  unlink,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'

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

const DATA_BASE_URL = (
  process.env.VITE_DATA_BASE_URL ||
  fileEnv.VITE_DATA_BASE_URL ||
  'https://bing-data.伴随.cn'
).replace(/\/+$/, '')

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  'public/wallpaper'
)

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function safeJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
}

async function fetchJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `请求失败：${response.status} ${url}`
    )
  }

  return response.json()
}

function renderPage(item) {
  const date = item.date
  const title = item.title || 'Bing Wallpaper'
  const description =
    item.description ||
    item.copyright ||
    `Bing 每日高清壁纸，${date}`

  const image =
    item.image ||
    item.sourceImage ||
    item.preview ||
    ''

  const canonicalUrl =
    `${SITE_URL}/wallpaper/${date}`

  const copyright =
    item.copyright || description

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: title,
    description,
    contentUrl: image || undefined,
    datePublished: date,
    url: canonicalUrl,
    copyrightNotice: copyright,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Bing Wallpaper · 每日高清壁纸',
      url: `${SITE_URL}/`
    }
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#080b12">
  <meta name="robots" content="index,follow,max-image-preview:large">

  <title>${escapeHtml(title)} · ${date} | Bing Wallpaper</title>
  <meta name="description" content="${escapeHtml(
    `${title}。${description}。浏览和下载 ${date} 的 Bing 每日高清壁纸。`
  )}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Bing Wallpaper">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''}

  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <script type="application/ld+json">${safeJson(jsonLd)}</script>

  <style>
    :root {
      color-scheme: dark;
      font-family: "DingTalk JinBuTi", system-ui, sans-serif;
      background: #080b12;
      color: #f8fafc;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(ellipse at 50% 0%, #1e293b 0%, transparent 52%),
        #080b12;
    }

    a { color: inherit; }

    .topbar {
      position: relative;
      z-index: 2;
      width: min(1440px, 100%);
      margin: 0 auto;
      padding: 24px clamp(20px, 5vw, 64px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand {
      text-decoration: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .brand-name {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: .04em;
    }

    .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
      letter-spacing: .12em;
      text-transform: uppercase;
    }

    .back-link {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 15px;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 999px;
      background: rgba(255,255,255,.06);
      color: #f8fafc;
      font-size: 13px;
      transition: background .2s, transform .2s;
    }

    .back-link:hover {
      background: rgba(255,255,255,.12);
      transform: translateY(-1px);
    }

    main {
      width: min(1440px, 100%);
      margin: 0 auto;
      padding: 18px clamp(20px, 5vw, 64px) 64px;
    }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #a5b4fc;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .2em;
      text-transform: uppercase;
    }

    .eyebrow::before {
      content: "";
      width: 24px;
      height: 1px;
      background: #818cf8;
    }

    h1 {
      margin: 16px 0 12px;
      font-size: clamp(27px, 4vw, 48px);
      line-height: 1.2;
      letter-spacing: -.035em;
    }

    .description {
      max-width: 760px;
      margin: 0;
      color: #aab4c5;
      font-size: 14px;
      line-height: 1.9;
    }

    .artwork {
      position: relative;
      margin-top: 32px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.13);
      border-radius: clamp(14px, 2vw, 24px);
      background: #111827;
      box-shadow:
        0 35px 100px rgba(0,0,0,.4),
        0 0 0 1px rgba(255,255,255,.025) inset;
    }

    .artwork img {
      display: block;
      width: 100%;
      height: auto;
      max-height: 76vh;
      object-fit: contain;
      background: #0b0f17;
    }

    .artwork-placeholder {
      min-height: 240px;
      display: grid;
      place-items: center;
      color: #94a3b8;
    }

    .details {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      padding-top: 24px;
    }

    .date {
      color: #a5b4fc;
      font-size: 12px;
      letter-spacing: .12em;
    }

    .copyright {
      max-width: 760px;
      margin-top: 10px;
      color: #8491a5;
      font-size: 12px;
      line-height: 1.8;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 16px;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 10px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      background: rgba(255,255,255,.06);
    }

    .action.primary {
      color: #0b1020;
      background: #e2e8f0;
      border-color: #e2e8f0;
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,.09);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 12px;
      color: #64748b;
      font-size: 11px;
      line-height: 1.8;
    }

    .footer a {
      color: #a5b4fc;
      text-decoration: none;
    }

    @media (max-width: 700px) {
      .topbar { padding-top: 18px; padding-bottom: 18px; }
      main { padding-top: 14px; padding-bottom: 40px; }
      .details { flex-direction: column; }
      .actions { width: 100%; }
      .action { flex: 1; }
      .artwork img { max-height: 60vh; }
      .footer { margin-top: 40px; }
    }
  </style>
</head>

<body>
  <header class="topbar">
    <a class="brand" href="/" aria-label="返回 Bing Wallpaper 首页">
      <span class="brand-name">Bing Wallpaper</span>
      <span class="brand-subtitle">Daily moments. Infinite world.</span>
    </a>

    <a class="back-link" href="/">
      <span aria-hidden="true">←</span>
      返回主页
    </a>
  </header>

  <main>
    <div class="eyebrow">Daily Wallpaper Archive</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="description">${escapeHtml(description)}</p>

    <figure class="artwork">
      ${
        image
          ? `<img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(title)}"
              width="${Number(item.width) || 3840}"
              height="${Number(item.height) || 2160}"
              fetchpriority="high"
              decoding="async"
            >`
          : `<div class="artwork-placeholder">壁纸图片暂时无法显示</div>`
      }
    </figure>

    <section class="details">
      <div>
        <div class="date">${date}</div>
        <div class="copyright">${escapeHtml(copyright)}</div>
      </div>

      <div class="actions">
        ${
          image
            ? `<a class="action" href="${escapeHtml(image)}" target="_blank" rel="noopener noreferrer">打开原图</a>
               <a class="action primary" href="${escapeHtml(image)}" download>下载壁纸</a>`
            : ''
        }
      </div>
    </section>

    <footer class="footer">
      <span>Bing Wallpaper · 每日高清壁纸收藏与色彩探索</span>
      <a href="/">浏览更多历史壁纸 →</a>
    </footer>
  </main>
</body>
</html>`
}

async function main() {
  console.log('正在加载壁纸索引...')

  const index = await fetchJson(
    `${DATA_BASE_URL}/data/index.json`
  )

  const indexItems = Array.isArray(index.items)
    ? index.items
    : []

  const dateEntries = indexItems
    .filter(item => DATE_PATTERN.test(item?.[0]))
    .map(item => ({
      date: item[0],
      title: item[1] || 'Bing Wallpaper',
      description: item[2] || ''
    }))

  if (!dateEntries.length) {
    throw new Error('索引中没有找到有效壁纸日期。')
  }

  const monthGroups = new Map()

  for (const entry of dateEntries) {
    const monthKey = entry.date.slice(0, 7)

    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, [])
    }

    monthGroups.get(monthKey).push(entry)
  }

  const fullItems = new Map()

  for (const monthKey of monthGroups.keys()) {
    const [year, month] = monthKey.split('-')
    const url =
      `${DATA_BASE_URL}/data/${year}/${month}.json`

    console.log(`读取壁纸数据：${monthKey}`)

    const monthData = await fetchJson(url)
    const items = Array.isArray(monthData.items)
      ? monthData.items
      : []

    for (const item of items) {
      if (DATE_PATTERN.test(item?.date)) {
        fullItems.set(item.date, item)
      }
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true })

  // 清理上次生成的日期 HTML，避免已删除日期残留。
  const oldFiles = await readdir(OUTPUT_DIR, {
    withFileTypes: true
  })

  for (const file of oldFiles) {
    if (
      file.isFile() &&
      /^\d{4}-\d{2}-\d{2}\.html$/.test(file.name)
    ) {
      await unlink(path.join(OUTPUT_DIR, file.name))
    }
  }

  let generated = 0

  for (const entry of dateEntries) {
    const fullItem = fullItems.get(entry.date)

    if (!fullItem) {
      throw new Error(
        `找不到 ${entry.date} 对应的月度壁纸数据，已中止生成。`
      )
    }

    const item = {
      ...entry,
      ...fullItem,
      title: fullItem.title || entry.title,
      description:
        fullItem.description ||
        fullItem.copyright ||
        entry.description
    }

    const outputPath = path.join(
      OUTPUT_DIR,
      `${entry.date}.html`
    )

    await writeFile(
      outputPath,
      renderPage(item),
      'utf8'
    )

    generated += 1
  }

  console.log(
    `已生成 ${generated} 个独立壁纸页面：${OUTPUT_DIR}`
  )
}

main().catch(error => {
  console.error('生成壁纸详情页失败：', error)
  process.exitCode = 1
})
