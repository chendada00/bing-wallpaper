import { loadEnv } from 'vite'

const fileEnv = loadEnv(
  'production',
  process.cwd(),
  'VITE_'
)

import { readFile } from 'node:fs/promises'

const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const SHA_PATTERN = /^[0-9a-f]{40}$/i
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const SOURCE_CONFIG_PATH = new URL(
  '../data-source.json',
  import.meta.url
)

const config = JSON.parse(
  await readFile(SOURCE_CONFIG_PATH, 'utf8')
)

if (!REPOSITORY_PATTERN.test(config.repository || '')) {
  throw new Error('data-source.json 中的 repository 无效')
}

if (!SHA_PATTERN.test(config.ref || '')) {
  throw new Error(
    'data-source.json 中的 ref 必须是完整的 40 位 commit SHA'
  )
}

export const SOURCE_REPOSITORY = config.repository
export const SOURCE_SHA = config.ref.toLowerCase()

export const DATA_BASE_URL =
  `https://raw.githubusercontent.com/${SOURCE_REPOSITORY}/${SOURCE_SHA}`

const IMAGE_BASE_URL = (
  process.env.VITE_DATA_BASE_URL ||
  fileEnv.VITE_DATA_BASE_URL ||
  'https://bing-data.伴随.cn'
).replace(/\/+$/, '')

export function normalizeSourceImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const source = value.trim()

  if (source.startsWith('data:image/')) {
    return source
  }

  if (source.startsWith('data:') || source.startsWith('blob:')) {
    return ''
  }

  try {
    return new URL(source, `${IMAGE_BASE_URL}/`).href
  } catch {
    return ''
  }
}

export async function fetchSourceJson(relativePath) {
  const url = `${DATA_BASE_URL}/${relativePath.replace(/^\/+/, '')}`

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000)
  })

  if (!response.ok) {
    throw new Error(
      `读取固定版本数据失败：HTTP ${response.status} ${url}`
    )
  }

  try {
    return await response.json()
  } catch {
    throw new Error(`数据不是有效 JSON：${url}`)
  }
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
 * 读取同一 SHA 下的索引和全部相关月份文件。
 * 索引缺日期、月份文件缺失、月份内缺少索引日期，都会让构建失败。
 */
export async function loadSourceDataset() {
  console.log(`数据仓库：${SOURCE_REPOSITORY}`)
  console.log(`数据版本：${SOURCE_SHA}`)

  const index = await fetchSourceJson('data/index.json')

  if (!Array.isArray(index.items) || index.items.length === 0) {
    throw new Error('固定版本的 data/index.json 缺少有效 items')
  }

  const indexedDates = index.items.map(item => item?.[0])

  const invalidDates = indexedDates.filter(date => !isValidDate(date))
  if (invalidDates.length) {
    throw new Error(
      `index.json 存在无效日期，共 ${invalidDates.length} 条`
    )
  }

  const dates = [...new Set(indexedDates)]
    .sort((a, b) => b.localeCompare(a))

  if (dates.length !== indexedDates.length) {
    throw new Error('index.json 存在重复日期，已停止生成')
  }

  const months = [
    ...new Set(dates.map(date => date.slice(0, 7)))
  ]

  const wallpapers = new Map()
  const concurrency = 6
  let cursor = 0

  async function worker() {
    while (cursor < months.length) {
      const month = months[cursor++]
      const [year, monthNumber] = month.split('-')

      console.log(`读取固定版本月度数据：${month}`)

      const monthly = await fetchSourceJson(
        `data/${year}/${monthNumber}.json`
      )

      if (!Array.isArray(monthly.items)) {
        throw new Error(`${month} 月度 JSON 缺少 items 数组`)
      }

      for (const item of monthly.items) {
        if (!isValidDate(item?.date)) continue

        if (item.date.slice(0, 7) !== month) {
          throw new Error(
            `${month} 文件包含不属于该月份的数据：${item.date}`
          )
        }

        if (wallpapers.has(item.date)) {
          throw new Error(`月度数据存在重复日期：${item.date}`)
        }

        wallpapers.set(item.date, item)
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, months.length) },
      () => worker()
    )
  )

  const missingDates = dates.filter(date => !wallpapers.has(date))

  if (missingDates.length) {
    throw new Error(
      `月度 JSON 缺少 ${missingDates.length} 个索引日期：` +
      missingDates.slice(0, 10).join(', ')
    )
  }

  console.log(
    `数据完整性校验通过：${dates.length} 个日期，${months.length} 个月`
  )

  return {
    index,
    dates,
    months,
    wallpapers
  }
}
