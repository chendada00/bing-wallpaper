import {
  mkdir,
  readdir,
  unlink,
  writeFile
} from 'node:fs/promises'

import { loadEnv } from 'vite'
import path from 'node:path'

/**
 * =========================================================
 * 1. 环境配置
 * =========================================================
 */

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

console.log('开始生成沉浸式壁纸页面...')
console.log(`网站地址：${SITE_URL}`)
console.log(`数据地址：${DATA_BASE_URL}`)

/**
 * =========================================================
 * 2. HTML 安全转义
 * =========================================================
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function isValidDate(value) {
  if (!DATE_PATTERN.test(String(value ?? ''))) {
    return false
  }

  const date = new Date(`${value}T00:00:00Z`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
}

/**
 * =========================================================
 * 3. 数据地址处理
 *
 * 支持绝对 URL 和相对 URL。
 * =========================================================
 */

function normalizeImageUrl(value) {
  if (!value || typeof value !== 'string') {
    return ''
  }

  const source = value.trim()

  if (
    !source ||
    source.startsWith('data:') ||
    source.startsWith('blob:')
  ) {
    return source.startsWith('data:image/')
      ? source
      : ''
  }

  try {
    return new URL(
      source,
      `${DATA_BASE_URL}/`
    ).href
  } catch {
    return ''
  }
}

/**
 * =========================================================
 * 4. 数据加载
 * =========================================================
 */

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(30000)
  })

  if (!response.ok) {
    throw new Error(
      `请求数据失败：HTTP ${response.status} ${url}`
    )
  }

  return response.json()
}

async function loadWallpaperIndex() {
  const url = `${DATA_BASE_URL}/data/index.json`

  console.log(`读取壁纸索引：${url}`)

  const data = await fetchJson(url)

  const indexItems = Array.isArray(data.items)
    ? data.items
    : []

  const dates = [
    ...new Set(
      indexItems
        .map(item => item?.[0])
        .filter(isValidDate)
    )
  ].sort((a, b) => b.localeCompare(a))

  if (!dates.length) {
    throw new Error(
      'index.json 中没有找到有效的壁纸日期'
    )
  }

  return dates
}

/**
 * 按月份分组，避免每张壁纸都重复请求同一个月的数据。
 */
function groupDatesByMonth(dates) {
  const groups = new Map()

  for (const date of dates) {
    const month = date.slice(0, 7)

    if (!groups.has(month)) {
      groups.set(month, [])
    }

    groups.get(month).push(date)
  }

  return groups
}

async function loadMonthlyWallpapers(months) {
  const allWallpapers = new Map()

  const monthEntries = [...months.keys()]

  // 限制并发，避免历史数据较多时同时发出大量请求。
  const concurrency = 6

  let cursor = 0

  async function worker() {
    while (cursor < monthEntries.length) {
      const month = monthEntries[cursor++]

      const [year, monthNumber] = month.split('-')

      const url =
        `${DATA_BASE_URL}/data/` +
        `${year}/${monthNumber}.json`

      console.log(`读取月份数据：${month}`)

      const data = await fetchJson(url)

      const items = Array.isArray(data.items)
        ? data.items
        : []

      for (const item of items) {
        if (!isValidDate(item?.date)) {
          continue
        }

        allWallpapers.set(item.date, item)
      }
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          concurrency,
          monthEntries.length
        )
      },
      () => worker()
    )
  )

  return allWallpapers
}

/**
 * =========================================================
 * 5. 壁纸数据规范化
 * =========================================================
 */

function normalizeWallpaper(item, date) {
  const title =
    item?.title ||
    item?.copyright ||
    `Bing Wallpaper ${date}`

  const description =
    item?.description ||
    item?.copyright ||
    `${date} Bing 每日壁纸`

  // 与现有项目的图片 URL 优先级保持一致。
  const image =
    normalizeImageUrl(item?.sourceImage) ||
    normalizeImageUrl(item?.image) ||
    normalizeImageUrl(item?.preview)

  const preview =
    normalizeImageUrl(item?.preview) ||
    image

  // 首页使用的主色调字段。
  const color = /^#[0-9a-fA-F]{6}$/.test(
    item?.color || ''
  )
    ? item.color
    : '#52647A'

  return {
    date,
    title,
    description,
    image,
    preview,
    color,
    copyright: item?.copyright || '',
    width: Number(item?.width) || 0,
    height: Number(item?.height) || 0
  }
}

/**
 * =========================================================
 * 6. 页面生成
 * =========================================================
 */

function createWallpaperHtml(
  wallpaper,
  previousWallpaper,
  nextWallpaper,
  currentIndex,
  total
) {
  const {
    date,
    title,
    description,
    image,
    preview,
    color,
    copyright,
    width,
    height
  } = wallpaper

  const pageUrl =
    `${SITE_URL}/wallpaper/${date}`

  const escapedTitle = escapeHtml(title)
  const escapedDescription = escapeHtml(description)
  const escapedImage = escapeHtml(image)
  const escapedPreview = escapeHtml(preview)
  const escapedDate = escapeHtml(date)
  const escapedColor = escapeHtml(color)
  const escapedCopyright = escapeHtml(copyright)

  const previousLink = previousWallpaper
    ? `
      <a
        class="nav-button nav-previous"
        href="/wallpaper/${previousWallpaper.date}"
        aria-label="上一张：${escapeHtml(previousWallpaper.date)}"
        title="上一张 · ${escapeHtml(previousWallpaper.date)}"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        <span class="nav-label">上一张</span>
      </a>
    `
    : `
      <button
        class="nav-button nav-previous"
        disabled
        aria-label="没有更早的壁纸"
        title="没有更早的壁纸"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        <span class="nav-label">上一张</span>
      </button>
    `

  const nextLink = nextWallpaper
    ? `
      <a
        class="nav-button nav-next"
        href="/wallpaper/${nextWallpaper.date}"
        aria-label="下一张：${escapeHtml(nextWallpaper.date)}"
        title="下一张 · ${escapeHtml(nextWallpaper.date)}"
      >
        <span class="nav-label">下一张</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </a>
    `
    : `
      <button
        class="nav-button nav-next"
        disabled
        aria-label="没有更新的壁纸"
        title="没有更新的壁纸"
      >
        <span class="nav-label">下一张</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    `

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: title,
    description,
    contentUrl: image,
    url: pageUrl,
    datePublished: date,
    ...(width > 0 ? { width } : {}),
    ...(height > 0 ? { height } : {}),
    ...(copyright
      ? { creditText: copyright }
      : {})
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
  >

  <title>${escapedTitle} · ${escapedDate} | Bing Wallpaper</title>

  <meta
    name="description"
    content="${escapedDescription}"
  >

  <meta name="theme-color" content="#101114">

  <link
    rel="canonical"
    href="${escapeHtml(pageUrl)}"
  >
  <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Bing Wallpaper">
  <meta property="og:title" content="${escapedTitle}">
  <meta
    property="og:description"
    content="${escapedDescription}"
  >
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:image" content="${escapedPreview}">
  <meta property="og:image:alt" content="${escapedTitle}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta
    name="twitter:description"
    content="${escapedDescription}"
  >
  <meta name="twitter:image" content="${escapedPreview}">

  <link
    rel="preload"
    as="image"
    href="${escapedImage}"
    fetchpriority="high"
  >

  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>

  <style>
    @import url('https://fastly.jsdelivr.net/npm/cn-fontsource-ding-talk-jin-bu-ti-regular/font.css');
    html,
    body {
      font-family:
        "DingTalk JinBuTi",
        Roboto,
        sans-serif !important;
    }
    :root {
      color-scheme: dark;

      --accent: ${escapedColor};
      --bg: #101114;
      --text: rgba(255, 255, 255, .96);
      --muted: rgba(255, 255, 255, .65);
      --faint: rgba(255, 255, 255, .38);

      --glass: rgba(18, 20, 24, .38);
      --glass-border: rgba(255, 255, 255, .14);

      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    html {
      width: 100%;
      min-height: 100%;
      background: var(--bg);
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      min-width: 320px;
      min-height: 100vh;
      min-height: 100dvh;
      overflow-x: hidden;
      background: var(--bg);
      color: var(--text);
      font-family:
        "DingTalk JinBuTi",
        Roboto,
        sans-serif !important;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    button,
    a {
      -webkit-tap-highlight-color: transparent;
    }

    button {
      color: inherit;
      font: inherit;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    button:focus-visible,
    a:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 4px;
    }

    /* ================================================
       全屏背景：真实壁纸 + 主色调氛围
       ================================================ */

    .scene {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      background: var(--bg);
      pointer-events: none;
      isolation: isolate;
    }

    .scene-image {
      position: absolute;
      inset: -5%;
      width: 110%;
      height: 110%;
      object-fit: cover;
      object-position: center;
      opacity: .40;
      filter: blur(48px) saturate(1.18);
      transform: scale(1.06);
      transition:
        opacity 1s ease,
        filter 1s ease;
    }

    .scene-tint {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(
          ellipse at 50% 44%,
          color-mix(in srgb, var(--accent) 28%, transparent) 0%,
          color-mix(in srgb, var(--accent) 13%, transparent) 34%,
          transparent 70%
        );
      opacity: .85;
      transition: opacity .8s ease;
    }

    .scene-shade {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          180deg,
          rgba(5, 6, 9, .55) 0%,
          rgba(5, 6, 9, .10) 24%,
          rgba(5, 6, 9, .04) 48%,
          rgba(5, 6, 9, .25) 70%,
          rgba(5, 6, 9, .92) 100%
        );
    }

    .scene-vignette {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(
          ellipse at center,
          transparent 28%,
          rgba(0, 0, 0, .20) 72%,
          rgba(0, 0, 0, .48) 100%
        );
    }

    .scene-grain {
      position: absolute;
      inset: 0;
      opacity: .035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E");
    }

    /* ================================================
       页面框架
       ================================================ */

    .page {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      padding:
        calc(26px + var(--safe-top))
        38px
        calc(26px + var(--safe-bottom));
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      min-height: 42px;
      transition:
        opacity .45s ease,
        transform .45s ease;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      border: 1px solid rgba(255, 255, 255, .18);
      border-radius: 11px;
      background:
        linear-gradient(
          145deg,
          color-mix(in srgb, var(--accent) 50%, #34363b),
          rgba(255, 255, 255, .08)
        );
      box-shadow:
        0 4px 18px rgba(0, 0, 0, .18),
        inset 0 1px 0 rgba(255, 255, 255, .18);
    }

    .brand-mark svg {
      width: 19px;
      height: 19px;
      stroke: white;
    }

    .brand-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .brand-title {
      font-size: 13px;
      font-weight: 650;
      letter-spacing: .035em;
    }

    .brand-subtitle {
      color: var(--muted);
      font-size: 10px;
      letter-spacing: .14em;
      text-transform: uppercase;
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .top-link,
    .icon-button,
    .action-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      border: 1px solid var(--glass-border);
      border-radius: 999px;
      background: var(--glass);
      color: rgba(255, 255, 255, .9);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      transition:
        background .25s ease,
        border-color .25s ease,
        transform .25s ease,
        box-shadow .25s ease;
    }

    .top-link {
      min-height: 40px;
      padding: 0 17px;
      font-size: 12px;
      font-weight: 550;
    }

    .top-link svg,
    .icon-button svg,
    .action-button svg {
      width: 17px;
      height: 17px;
      flex: 0 0 auto;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .top-link:hover,
    .icon-button:hover,
    .action-button:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, .13);
      border-color: color-mix(
        in srgb,
        var(--accent) 65%,
        rgba(255, 255, 255, .4)
      );
      box-shadow: 0 8px 30px rgba(0, 0, 0, .16);
    }

    /* ================================================
       中间壁纸舞台
       ================================================ */

    .stage {
      position: relative;
      display: flex;
      flex: 1 0 auto;
      align-items: center;
      justify-content: center;
      min-height: 340px;
      padding: 28px 76px 20px;
    }

    .wallpaper-frame {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: min(70vh, 760px);
      height: min(70dvh, 760px);
      min-height: 300px;
      isolation: isolate;
      animation: image-enter .9s cubic-bezier(.2, .7, .2, 1) both;
    }

    .wallpaper-frame::before {
      content: "";
      position: absolute;
      z-index: -1;
      inset: 8% 12%;
      border-radius: 50%;
      background: color-mix(
        in srgb,
        var(--accent) 26%,
        transparent
      );
      filter: blur(75px);
      opacity: .45;
      transform: scale(.95);
      transition:
        background 1s ease,
        opacity 1s ease;
    }

    .wallpaper-image {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 15px;
      opacity: 0;
      transform: translateY(10px) scale(.99);
      filter:
        drop-shadow(0 24px 50px rgba(0, 0, 0, .26))
        drop-shadow(0 4px 12px rgba(0, 0, 0, .18));
      transition:
        opacity .6s ease,
        transform .7s cubic-bezier(.2, .7, .2, 1);
    }

    .wallpaper-image.loaded {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .image-fallback {
      display: none;
      max-width: 520px;
      color: var(--muted);
      text-align: center;
      font-size: 13px;
      line-height: 1.8;
    }

    /* ================================================
       左右切换
       ================================================ */

    .nav-button {
      position: absolute;
      z-index: 5;
      top: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-width: 48px;
      height: 48px;
      padding: 0 14px;
      border: 1px solid rgba(255, 255, 255, .17);
      border-radius: 999px;
      background: rgba(20, 22, 27, .34);
      color: rgba(255, 255, 255, .9);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      cursor: pointer;
      transform: translateY(-50%);
      transition:
        opacity .3s ease,
        background .25s ease,
        border-color .25s ease,
        transform .25s ease;
    }

    .nav-previous {
      left: 0;
    }

    .nav-next {
      right: 0;
    }

    .nav-button svg {
      width: 19px;
      height: 19px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .nav-label {
      font-size: 12px;
      white-space: nowrap;
    }

    .nav-button:hover:not(:disabled) {
      background: color-mix(
        in srgb,
        var(--accent) 32%,
        rgba(20, 22, 27, .72)
      );
      border-color: color-mix(
        in srgb,
        var(--accent) 75%,
        white
      );
    }

    .nav-previous:hover:not(:disabled) {
      transform: translate(-3px, -50%);
    }

    .nav-next:hover:not(:disabled) {
      transform: translate(3px, -50%);
    }

    .nav-button:disabled {
      opacity: .22;
      cursor: default;
    }

    /* ================================================
       底部图片信息
       ================================================ */

    .bottom {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 32px;
      width: 100%;
      padding: 0 2px;
      transition:
        opacity .45s ease,
        transform .45s ease;
    }

    .information {
      min-width: 0;
      max-width: 850px;
    }

    .eyebrow {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 11px;
      margin-bottom: 14px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 550;
      letter-spacing: .11em;
    }

    .eyebrow-date {
      color: color-mix(
        in srgb,
        var(--accent) 78%,
        white
      );
    }

    .eyebrow-separator {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: rgba(255, 255, 255, .4);
    }

    .wallpaper-title {
      margin: 0;
      max-width: 820px;
      color: var(--text);
      font-size: clamp(24px, 3.2vw, 44px);
      font-weight: 620;
      line-height: 1.23;
      letter-spacing: -.035em;
      text-wrap: pretty;
      text-shadow: 0 3px 28px rgba(0, 0, 0, .25);
    }

    .wallpaper-description {
      margin: 13px 0 0;
      max-width: 700px;
      color: rgba(255, 255, 255, .67);
      font-size: 13px;
      font-weight: 400;
      line-height: 1.8;
      text-wrap: pretty;
    }

    .copyright {
      margin-top: 10px;
      color: rgba(255, 255, 255, .38);
      font-size: 10px;
      line-height: 1.6;
    }

    .bottom-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 9px;
      padding-bottom: 2px;
    }

    .action-button {
      min-height: 43px;
      padding: 0 16px;
      font-size: 12px;
      font-weight: 550;
      white-space: nowrap;
    }

    .action-primary {
      border-color: color-mix(
        in srgb,
        var(--accent) 70%,
        rgba(255, 255, 255, .25)
      );
      background: color-mix(
        in srgb,
        var(--accent) 32%,
        rgba(20, 22, 27, .70)
      );
      box-shadow:
        0 6px 28px color-mix(
          in srgb,
          var(--accent) 16%,
          transparent
        );
    }

    .action-primary:hover {
      background: color-mix(
        in srgb,
        var(--accent) 48%,
        rgba(20, 22, 27, .55)
      );
    }

    /* ================================================
       底部进度
       ================================================ */

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-top: 25px;
      color: rgba(255, 255, 255, .37);
      font-size: 10px;
      letter-spacing: .07em;
      transition: opacity .45s ease;
    }

    .progress {
      position: relative;
      flex: 1;
      max-width: 220px;
      height: 2px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(255, 255, 255, .13);
    }

    .progress-value {
      position: absolute;
      inset: 0 auto 0 0;
      width: ${((currentIndex + 1) / total) * 100}%;
      border-radius: inherit;
      background: color-mix(
        in srgb,
        var(--accent) 78%,
        white
      );
      box-shadow: 0 0 14px color-mix(
        in srgb,
        var(--accent) 65%,
        transparent
      );
    }

    .keyboard-hint {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    kbd {
      display: inline-grid;
      place-items: center;
      min-width: 20px;
      height: 19px;
      padding: 0 5px;
      border: 1px solid rgba(255, 255, 255, .15);
      border-radius: 5px;
      background: rgba(255, 255, 255, .05);
      color: rgba(255, 255, 255, .58);
      font: inherit;
    }

    /* ================================================
       沉浸模式：桌面端自动隐藏控制栏
       ================================================ */

    body.ui-hidden .topbar,
    body.ui-hidden .bottom,
    body.ui-hidden .footer {
      opacity: 0;
      pointer-events: none;
      transform: translateY(5px);
    }

    body.ui-hidden .nav-button {
      opacity: 0;
      pointer-events: none;
    }

    body.ui-hidden:hover .topbar,
    body.ui-hidden:hover .bottom,
    body.ui-hidden:hover .footer {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    body.ui-hidden:hover .nav-button {
      opacity: 1;
      pointer-events: auto;
    }

    /* ================================================
       响应式
       ================================================ */

    @media (min-width: 1600px) {
      .page {
        padding-right: 64px;
        padding-left: 64px;
      }

      .stage {
        padding-right: 100px;
        padding-left: 100px;
      }

      .wallpaper-frame {
        height: min(73dvh, 940px);
      }
    }

    @media (max-width: 1050px) {
      .page {
        padding-right: 25px;
        padding-left: 25px;
      }

      .stage {
        padding-right: 60px;
        padding-left: 60px;
      }

      .bottom {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .bottom-actions {
        justify-content: flex-start;
      }

      .wallpaper-frame {
        height: min(62dvh, 680px);
      }
    }

    @media (max-width: 640px) {
      .page {
        padding:
          calc(15px + var(--safe-top))
          15px
          calc(15px + var(--safe-bottom));
      }

      .topbar {
        gap: 10px;
      }

      .brand {
        gap: 8px;
      }

      .brand-mark {
        width: 30px;
        height: 30px;
        flex-basis: 30px;
        border-radius: 9px;
      }

      .brand-title {
        font-size: 12px;
      }

      .brand-subtitle {
        font-size: 8px;
        letter-spacing: .08em;
      }

      .top-actions {
        gap: 6px;
      }

      .top-link {
        min-height: 35px;
        padding: 0 11px;
        font-size: 11px;
      }

      .stage {
        min-height: 300px;
        padding: 18px 0 20px;
      }

      .wallpaper-frame {
        height: min(57dvh, 600px);
        min-height: 260px;
      }

      .wallpaper-image {
        max-width: 100%;
        max-height: 100%;
      }

      .nav-button {
        top: auto;
        bottom: 12px;
        min-width: 42px;
        height: 42px;
        padding: 0 12px;
        transform: none;
      }

      .nav-previous {
        left: 0;
      }

      .nav-next {
        right: 0;
      }

      .nav-previous:hover:not(:disabled),
      .nav-next:hover:not(:disabled) {
        transform: none;
      }

      .nav-label {
        font-size: 11px;
      }

      .bottom {
        gap: 19px;
      }

      .eyebrow {
        gap: 8px;
        margin-bottom: 10px;
        font-size: 10px;
      }

      .wallpaper-title {
        font-size: clamp(23px, 6.2vw, 32px);
        line-height: 1.28;
      }

      .wallpaper-description {
        margin-top: 10px;
        font-size: 12px;
        line-height: 1.75;
      }

      .copyright {
        font-size: 10px;
      }

      .bottom-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .action-button {
        min-height: 42px;
        padding: 0 10px;
        gap: 7px;
        font-size: 11px;
      }

      .action-button svg {
        width: 15px;
        height: 15px;
      }

      .footer {
        gap: 10px;
        margin-top: 20px;
        font-size: 9px;
      }

      .progress {
        max-width: none;
      }

      .keyboard-hint {
        display: none;
      }

      /* 手机端不自动隐藏操作按钮。 */
      body.ui-hidden .topbar,
      body.ui-hidden .bottom,
      body.ui-hidden .footer {
        opacity: 1;
        pointer-events: auto;
        transform: none;
      }

      body.ui-hidden .nav-button {
        opacity: 1;
        pointer-events: auto;
      }
    }

    @media (max-width: 360px) {
      .brand-subtitle {
        display: none;
      }

      .top-link {
        padding: 0 9px;
      }

      .action-button {
        padding: 0 8px;
        gap: 5px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: .01ms !important;
      }
    }

    @keyframes image-enter {
      from {
        opacity: 0;
        transform: translateY(12px) scale(.985);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }



    /* ================================================
    视口高度优化：桌面端沉浸式详情页
    追加在生成 HTML 的内嵌 style 最末尾
    ================================================ */
    
    @media (min-width: 641px) {
      html {
        height: 100%;
        overflow-x: clip;
      }
    
      body {
        height: 100%;
        min-height: 0;
        overflow-x: clip;
      }
    
      .page {
        width: 100%;
        height: 100vh;
        height: 100dvh;
    
        min-height: 0;
    
        padding:
          calc(18px + var(--safe-top))
          38px
          calc(16px + var(--safe-bottom));
    
        box-sizing: border-box;
        overflow: clip;
      }
    
      /* 顶部品牌与操作栏悬浮在图片上方 */
    
      .topbar {
        position: absolute;
    
        top: calc(18px + var(--safe-top));
        left: 38px;
        right: 38px;
    
        z-index: 20;
    
        min-height: 42px;
    
        pointer-events: none;
      }
    
      .topbar > * {
        pointer-events: auto;
      }
    
      /* 图片舞台占据剩余空间 */
    
      .stage {
        flex: 1 1 0;
    
        min-height: 0;
    
        padding: 52px 76px 12px;
    
        box-sizing: border-box;
      }
    
      /* 不再使用固定的 300px 最小高度 */
    
      .wallpaper-frame {
        width: 100%;
    
        height: 100%;
        max-height: calc(100dvh - 240px);
    
        min-height: 0;
    
        box-sizing: border-box;
      }
    
      .wallpaper-image {
        display: block;
    
        max-width: 100%;
        max-height: 100%;
    
        width: auto;
        height: auto;
    
        object-fit: contain;
      }
    
      /* 底部内容不被图片舞台挤压 */
    
      .bottom {
        flex: 0 0 auto;
    
        gap: 24px;
        margin-top: 0;
      }
    
      .footer {
        flex: 0 0 auto;
    
        margin-top: 12px;
      }
    }
    
    /* 中等宽度：缩小左右边距 */
    
    @media (min-width: 641px) and (max-width: 1050px) {
      .page {
        padding-right: 24px;
        padding-left: 24px;
      }
    
      .topbar {
        left: 24px;
        right: 24px;
      }
    
      .stage {
        padding-right: 60px;
        padding-left: 60px;
      }
    
      .wallpaper-frame {
        max-height: calc(100dvh - 260px);
      }
    
      .bottom {
        gap: 16px;
      }
    }
    
    /* 手机端恢复自然文档流，避免内容被裁切 */
    
    @media (max-width: 640px) {
      html,
      body {
        height: auto;
        min-height: 100%;
        overflow-x: hidden;
      }
    
      .page {
        height: auto;
        min-height: 100vh;
        min-height: 100dvh;
    
        overflow: visible;
      }
    
      .topbar {
        position: relative;
        inset: auto;
    
        pointer-events: auto;
      }
    
      .topbar > * {
        pointer-events: auto;
      }
    
      .stage {
        flex: 1 0 auto;
        min-height: 300px;
      }
    
      .wallpaper-frame {
        height: min(57dvh, 600px);
        min-height: 260px;
      }
    }
 
  </style>
</head>

<body>
  <!-- 动态背景：当前壁纸的模糊大图 -->
  <div class="scene" aria-hidden="true">
    <img
      class="scene-image"
      src="${escapedPreview}"
      alt=""
      fetchpriority="low"
    >
    <div class="scene-tint"></div>
    <div class="scene-shade"></div>
    <div class="scene-vignette"></div>
    <div class="scene-grain"></div>
  </div>

  <main class="page">
    <header class="topbar">
      <a class="brand" href="/" aria-label="返回 Bing Wallpaper 首页">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 4v16l14-8-6-3.5"/>
            <path d="M5 12 13 8"/>
          </svg>
        </span>

        <span class="brand-copy">
          <span class="brand-title">Bing Wallpaper</span>
          <span class="brand-subtitle">A moment of nature</span>
        </span>
      </a>

      <div class="top-actions">
        <a class="top-link" href="/" title="返回首页">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 10 9-7 9 7"/>
            <path d="M5 9v11h14V9"/>
            <path d="M9 20v-6h6v6"/>
          </svg>
          <span>返回首页</span>
        </a>
      </div>
    </header>

    <section class="stage" aria-label="壁纸浏览区域">
      ${previousLink}

      <div class="wallpaper-frame">
        <img
          id="wallpaperImage"
          class="wallpaper-image"
          src="${escapedImage}"
          alt="${escapedTitle}"
          width="${width || ''}"
          height="${height || ''}"
          fetchpriority="high"
          decoding="async"
        >

        <div class="image-fallback" id="imageFallback">
          <p>这张壁纸暂时无法加载。</p>
          <p>你可以尝试打开原图，或返回首页浏览其他壁纸。</p>
        </div>
      </div>

      ${nextLink}
    </section>

    <section class="bottom" aria-labelledby="wallpaperTitle">
      <div class="information">
        <div class="eyebrow">
          <span class="eyebrow-date">${escapedDate}</span>
          <span class="eyebrow-separator"></span>
          <span>BING DAILY WALLPAPER</span>
        </div>

        <h1 class="wallpaper-title" id="wallpaperTitle">
          ${escapedTitle}
        </h1>

        <p class="wallpaper-description">
          ${escapedDescription}
        </p>

        ${
          copyright
            ? `<p class="copyright">${escapedCopyright}</p>`
            : ''
        }
      </div>

      <div class="bottom-actions">
        <a
          class="action-button action-primary"
          href="${escapedImage}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 3h7v7"/>
            <path d="M10 14 21 3"/>
            <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>
          </svg>
          <span>打开原图</span>
        </a>

        <a
          class="action-button"
          href="${escapedImage}"
          download="bing-wallpaper-${escapedDate}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v12"/>
            <path d="m7 10 5 5 5-5"/>
            <path d="M5 17v4h14v-4"/>
          </svg>
          <span>下载壁纸</span>
        </a>
      </div>
    </section>

    <footer class="footer">
      <span>WALLPAPER ${String(currentIndex + 1).padStart(3, '0')}</span>

      <div
        class="progress"
        role="progressbar"
        aria-label="壁纸浏览进度"
        aria-valuemin="1"
        aria-valuemax="${total}"
        aria-valuenow="${currentIndex + 1}"
      >
        <span class="progress-value"></span>
      </div>

      <span>${String(total).padStart(3, '0')} IMAGES</span>

      <span class="keyboard-hint">
        <kbd>←</kbd>
        <kbd>→</kbd>
        <span>切换壁纸</span>
      </span>
    </footer>
  </main>

  <script>
    (() => {
      const body = document.body
      const image = document.getElementById('wallpaperImage')
      const fallback = document.getElementById('imageFallback')
      const sceneImage = document.querySelector('.scene-image')

      const previousLink = document.querySelector(
        '.nav-previous[href]'
      )

      const nextLink = document.querySelector(
        '.nav-next[href]'
      )

      let hideTimer = null

      const isMobile = window.matchMedia(
        '(max-width: 640px)'
      ).matches

      /**
       * 图片加载完成后再淡入，避免页面出现突兀闪烁。
       */
      function revealImage() {
        image.classList.add('loaded')
        fallback.style.display = 'none'
      }

      function showImageError() {
        image.style.display = 'none'
        fallback.style.display = 'block'
      }

      if (image.complete && image.naturalWidth > 0) {
        revealImage()
      } else {
        image.addEventListener(
          'load',
          revealImage,
          { once: true }
        )

        image.addEventListener(
          'error',
          showImageError,
          { once: true }
        )
      }

      /**
       * 背景图加载失败不影响前景壁纸。
       */
      if (sceneImage) {
        sceneImage.addEventListener('error', () => {
          sceneImage.style.display = 'none'
        }, { once: true })
      }

      /**
       * 预加载相邻图片。
       */
      function preloadLink(link) {
        if (!link) return

        const target = new Image()
        target.decoding = 'async'
        target.src = link.href
      }

      preloadLink(previousLink)
      preloadLink(nextLink)

      /**
       * 桌面端自动隐藏控制栏。
       * 移动端始终保留控制栏，避免用户找不到按钮。
       */
      function showUI() {
        body.classList.remove('ui-hidden')

        if (hideTimer) {
          clearTimeout(hideTimer)
          hideTimer = null
        }

        if (isMobile) return

        hideTimer = setTimeout(() => {
          body.classList.add('ui-hidden')
        }, 4200)
      }

      if (!isMobile) {
        document.addEventListener(
          'mousemove',
          showUI,
          { passive: true }
        )

        document.addEventListener(
          'keydown',
          showUI
        )

        document.addEventListener(
          'click',
          showUI
        )

        showUI()
      }

      /**
       * 键盘操作：
       * 左方向键 = 上一张（更早的壁纸）
       * 右方向键 = 下一张（更新的壁纸）
       * Home = 首页
       */
      document.addEventListener('keydown', event => {
        if (
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          return
        }

        const target = event.target

        if (
          target instanceof HTMLElement &&
          (
            target.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(
              target.tagName
            )
          )
        ) {
          return
        }

        if (event.key === 'ArrowLeft' && previousLink) {
          event.preventDefault()
          window.location.href = previousLink.href
        }

        if (event.key === 'ArrowRight' && nextLink) {
          event.preventDefault()
          window.location.href = nextLink.href
        }

        if (event.key === 'Home') {
          event.preventDefault()
          window.location.href = '/'
        }

        if (event.key === 'Escape') {
          window.location.href = '/'
        }
      })

      /**
       * 如果浏览器支持色彩混合和动画，
       * 当前页面主题已经通过 CSS 的 --accent 自动生效。
       */
      window.addEventListener('pagehide', () => {
        if (hideTimer) {
          clearTimeout(hideTimer)
        }
      })
    })()
  </script>
</body>
</html>
`
}

/**
 * =========================================================
 * 7. 生成所有独立页面
 * =========================================================
 */

async function main() {
  const dates = await loadWallpaperIndex()

  const months = groupDatesByMonth(dates)

  console.log(`索引中共有 ${dates.length} 个日期`)
  console.log(`需要读取 ${months.size} 个月的数据`)

  const rawWallpapers = await loadMonthlyWallpapers(months)

  const wallpapers = dates
    .map(date => {
      const item = rawWallpapers.get(date)

      if (!item) {
        throw new Error(
          `找不到 ${date} 的月度壁纸数据，已停止生成，避免生成不完整页面`
        )
      }

      const wallpaper = normalizeWallpaper(item, date)

      if (!wallpaper.image) {
        throw new Error(
          `${date} 缺少可用图片地址（sourceImage、image、preview），请检查月度 JSON`
        )
      }

      return wallpaper
    })

  await mkdir(OUTPUT_DIR, {
    recursive: true
  })

  /**
   * 删除上次生成的日期 HTML，避免已删除日期残留旧页面。
   * 不会删除目录内其他文件。
   */
  const existingFiles = await readdir(
    OUTPUT_DIR,
    { withFileTypes: true }
  )

  for (const file of existingFiles) {
    if (
      file.isFile() &&
      /^\d{4}-\d{2}-\d{2}\.html$/.test(file.name)
    ) {
      await unlink(
        path.join(OUTPUT_DIR, file.name)
      )
    }
  }

  /**
   * dates 已经按日期倒序排列：
   *
   * [0] 最新壁纸
   * [1] 上一张较早壁纸
   * [2] 更早壁纸
   *
   * 因此：
   * previousWallpaper = index + 1
   * nextWallpaper = index - 1
   */
  for (let index = 0; index < wallpapers.length; index++) {
    const wallpaper = wallpapers[index]

    const previousWallpaper =
      wallpapers[index + 1] || null

    const nextWallpaper =
      index > 0
        ? wallpapers[index - 1]
        : null

    const html = createWallpaperHtml(
      wallpaper,
      previousWallpaper,
      nextWallpaper,
      index,
      wallpapers.length
    )

    const outputFile = path.join(
      OUTPUT_DIR,
      `${wallpaper.date}.html`
    )

    await writeFile(
      outputFile,
      html,
      'utf8'
    )
  }

  console.log('')
  console.log('沉浸式壁纸页面生成完成')
  console.log(`生成数量：${wallpapers.length}`)
  console.log(`输出目录：${OUTPUT_DIR}`)
  console.log(
    `示例页面：${SITE_URL}/wallpaper/${wallpapers[0].date}`
  )
}

main().catch(error => {
  console.error('')
  console.error('生成沉浸式壁纸页面失败：')
  console.error(error)
  process.exitCode = 1
})
