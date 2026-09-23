import { ref } from 'vue'

import {
  currentMonth,
  monthKey,
  pad2,
  previousMonth
} from '../utils/date'

const DEFAULT_BASE_URL =
  'https://raw.githubusercontent.com/chendada00/bing-data/main'

const DATA_BASE_URL = (
  import.meta.env.VITE_DATA_BASE_URL ||
  DEFAULT_BASE_URL
).replace(/\/$/, '')

const MAX_EMPTY_MONTHS = 3

function normalizeItem(item) {
  const image = item.image || item.sourceImage || ''
  const preview = item.preview || item.image || ''

  return {
    ...item,
    date: item.date || '',
    title: item.title || 'Bing Wallpaper',
    description: item.description || item.copyright || '',
    copyright: item.copyright || '',
    copyrightLink: item.copyrightLink || item.copyrightlink || '',
    image,
    preview,
    base64: item.base64 || '',
    color: item.color || {}
  }
}

export function useBingData() {
  const items = ref([])
  const loading = ref(false)
  const initialLoading = ref(true)
  const error = ref('')
  const noMore = ref(false)

  const loadedMonths = new Set()
  const monthCache = new Map()
  const monthPromises = new Map()

  let cursor = null
  let emptyMonths = 0

  async function fetchMonth(year, month) {
    const key = monthKey(year, month)

    if (monthCache.has(key)) {
      return {
        items: monthCache.get(key),
        exists: true,
        key
      }
    }

    if (loadedMonths.has(key)) {
      return monthPromises.get(key) || {
        items: monthCache.get(key) || [],
        exists: true,
        key
      }
    }

    loadedMonths.add(key)

    const promise = (async () => {
      const url = `${DATA_BASE_URL}/data/${year}/${pad2(month)}.json`

      try {
        const response = await fetch(url, { cache: 'no-cache' })

        if (response.status === 404) {
          monthCache.set(key, [])
          return { items: [], exists: false, key }
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const monthItems = Array.isArray(data.items)
          ? data.items.map(normalizeItem)
          : []

        monthCache.set(key, monthItems)
        return { items: monthItems, exists: true, key }
      } catch (err) {
        loadedMonths.delete(key)
        monthCache.delete(key)
        throw err
      } finally {
        monthPromises.delete(key)
      }
    })()

    monthPromises.set(key, promise)
    return promise
  }

  function appendUnique(newItems) {
    const existingDates = new Set(items.value.map(item => item.date))

    const unique = newItems
      .filter(item => item.date && !existingDates.has(item.date))
      .sort((a, b) => b.date.localeCompare(a.date))

    if (unique.length) {
      items.value.push(...unique)
      items.value.sort((a, b) => b.date.localeCompare(a.date))
    }

    return unique.length
  }

  async function loadNextMonth() {
    if (loading.value || noMore.value || !cursor) return false

    loading.value = true
    error.value = ''

    try {
      let found = false
      let checked = 0

      while (!found && checked < MAX_EMPTY_MONTHS) {
        const result = await fetchMonth(cursor.year, cursor.month)

        cursor = previousMonth(cursor.year, cursor.month)
        checked += 1

        if (result.items.length > 0) {
          appendUnique(result.items)
          found = true
          emptyMonths = 0
        } else {
          emptyMonths += 1
        }
      }

      if (!found && emptyMonths >= MAX_EMPTY_MONTHS) {
        noMore.value = true
      }

      return found
    } catch (err) {
      console.error('加载历史壁纸失败:', err)
      error.value = '历史壁纸加载失败，请稍后重试。'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 按日期批量加载历史搜索结果。
   * 同一个月份只请求一次，避免“命中 30 天 = 30 个 HTTP 请求”。
   */
  async function loadDates(dates) {
    const validDates = Array.from(new Set(
      (Array.isArray(dates) ? dates : [])
        .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    ))

    if (!validDates.length) return []

    const groups = new Map()

    for (const date of validDates) {
      const year = date.slice(0, 4)
      const month = date.slice(5, 7)
      const key = `${year}-${month}`

      if (!groups.has(key)) {
        groups.set(key, { year: Number(year), month: Number(month) })
      }
    }

    const results = await Promise.all(
      Array.from(groups.values()).map(({ year, month }) =>
        fetchMonth(year, month)
      )
    )

    const loaded = results.flatMap(result => result.items)
    appendUnique(loaded)

    return loaded
  }

  async function loadInitial() {
    if (loading.value || items.value.length > 0) return

    cursor = currentMonth()
    initialLoading.value = true
    noMore.value = false
    emptyMonths = 0

    try {
      await loadNextMonth()
    } finally {
      initialLoading.value = false
    }
  }

  async function retry() {
    error.value = ''
    await loadNextMonth()
  }

  return {
    items,
    loading,
    initialLoading,
    error,
    noMore,
    loadInitial,
    loadNextMonth,
    loadDates,
    retry,
    dataBaseUrl: DATA_BASE_URL
  }
}
