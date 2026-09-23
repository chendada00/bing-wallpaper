const DEFAULT_SITE_TITLE =
  'Bing Wallpaper · 每日高清壁纸'

const DEFAULT_SITE_DESCRIPTION =
  '每日 Bing 高清壁纸收藏，永久保存历史壁纸，支持浏览、搜索和下载历史 Bing Wallpaper。'

function getSiteUrl() {
  const configured =
    import.meta.env.VITE_SITE_URL

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return window.location.origin
}

function upsertMeta(attribute, value, content) {
  let element =
    document.head.querySelector(
      `meta[${attribute}="${value}"]`
    )

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, value)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setCanonical(url) {
  let link =
    document.head.querySelector(
      'link[data-seo-canonical]'
    )

  if (!link) {
    link = document.createElement('link')

    link.rel = 'canonical'

    link.dataset.seoCanonical = 'true'

    document.head.appendChild(link)
  }

  link.href = url
}

function setRobots(content) {
  upsertMeta(
    'name',
    'robots',
    content
  )
}

function setJsonLd(data) {
  let script =
    document.head.querySelector(
      'script[data-seo-jsonld]'
    )

  if (!script) {
    script = document.createElement('script')

    script.type =
      'application/ld+json'

    script.dataset.seoJsonld = 'true'

    document.head.appendChild(script)
  }

  script.textContent =
    JSON.stringify(data)
}

function removeJsonLd() {
  const script =
    document.head.querySelector(
      'script[data-seo-jsonld]'
    )

  if (script) {
    script.remove()
  }
}

function setOpenGraph({
  title,
  description,
  url,
  image
}) {
  upsertMeta(
    'property',
    'og:type',
    'website'
  )

  upsertMeta(
    'property',
    'og:title',
    title
  )

  upsertMeta(
    'property',
    'og:description',
    description
  )

  upsertMeta(
    'property',
    'og:url',
    url
  )

  if (image) {
    upsertMeta(
      'property',
      'og:image',
      image
    )
  }

  upsertMeta(
    'name',
    'twitter:card',
    'summary_large_image'
  )

  upsertMeta(
    'name',
    'twitter:title',
    title
  )

  upsertMeta(
    'name',
    'twitter:description',
    description
  )

  if (image) {
    upsertMeta(
      'name',
      'twitter:image',
      image
    )
  }
}

function shortenDescription(text, maxLength = 160) {
  const value =
    String(text || '').trim()

  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1)}…`
}

export function setHomeSeo() {
  const siteUrl =
    getSiteUrl()

  const url =
    `${siteUrl}/`

  const title =
    DEFAULT_SITE_TITLE

  const description =
    DEFAULT_SITE_DESCRIPTION

  document.title = title

  upsertMeta(
    'name',
    'description',
    description
  )

  setRobots(
    'index,follow,max-image-preview:large'
  )

  setCanonical(url)

  setOpenGraph({
    title,
    description,
    url
  })

  setJsonLd({
    '@context':
      'https://schema.org',

    '@type':
      'WebSite',

    name:
      'Bing Wallpaper',

    description,

    url
  })
}

export function setWallpaperSeo(item) {
  const siteUrl =
    getSiteUrl()

  const date =
    item?.date || ''

  const title =
    item?.title ||
    'Bing Wallpaper'

  const description =
    shortenDescription(
      item?.description ||
      item?.copyright ||
      title
    )

  const url =
    `${siteUrl}/wallpaper/${date}`

  document.title =
    `${title} · Bing Wallpaper · ${date}`

  upsertMeta(
    'name',
    'description',
    description
  )

  setRobots(
    'index,follow,max-image-preview:large'
  )

  setCanonical(url)

  setOpenGraph({
    title:
      `${title} · Bing Wallpaper`,

    description,

    url,

    image:
      item?.image || ''
  })

  setJsonLd({
    '@context':
      'https://schema.org',

    '@type':
      'ImageObject',

    '@id':
      `${url}#image`,

    name: title,

    description,

    contentUrl:
      item?.image || '',

    url,

    caption: description,

    datePublished:
      date
        ? `${date}T00:00:00+08:00`
        : undefined
  })
}

export function setNotFoundSeo() {
  const siteUrl =
    getSiteUrl()

  const url =
    `${siteUrl}${window.location.pathname}`

  document.title =
    '壁纸不存在 · Bing Wallpaper'

  upsertMeta(
    'name',
    'description',
    '找不到对应日期的 Bing Wallpaper。'
  )

  setRobots(
    'noindex,nofollow'
  )

  setCanonical(url)

  setOpenGraph({
    title:
      '壁纸不存在 · Bing Wallpaper',

    description:
      '找不到对应日期的 Bing Wallpaper。',

    url
  })

  removeJsonLd()
}