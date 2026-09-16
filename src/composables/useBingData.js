import { ref } from 'vue'
import { currentMonth, monthKey, pad2, previousMonth } from '../utils/date'

const DEFAULT_BASE_URL = 'https://raw.githubusercontent.com/chendada00/bing-data/main'
const DATA_BASE_URL = (import.meta.env.VITE_DATA_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
const MAX_EMPTY_MONTHS = 3

function normalizeItem(item) {
  return {
    ...item,
    date: item.date || '',
    title: item.title || 'Bing Wallpaper',
    description: item.description || item.copyright || '',
    copyright: item.copyright || '',
    image: item.image || item.sourceImage || '',
    preview: item.preview || item.image || item.sourceImage || '',
    base64: item.base64 || '',
    color: item.color || {},
  }
}

export function useBingData() {
  const items = ref([])
  const loading = ref(false)
  const initialLoading = ref(true)
  const error = ref('')
  const noMore = ref(false)
  const loadedMonths = new Set()
  let cursor = null
  let emptyMonths = 0

  async function fetchMonth(year, month) {
    const key = monthKey(year, month)
    if (loadedMonths.has(key)) return { items: [], exists: true }

    loadedMonths.add(key)
    const url = `${DATA_BASE_URL}/data/${year}/${pad2(month)}.json`

    try {
      const response = await fetch(url, { cache: 'no-cache' })
      if (response.status === 404) return { items: [], exists: false }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      const monthItems = Array.isArray(data.items) ? data.items.map(normalizeItem) : []
      return { items: monthItems, exists: true }
    } catch (err) {
      loadedMonths.delete(key)
      throw err
    }
  }

  function appendUnique(newItems) {
    const existing = new Set(items.value.map((item) => item.date))
    const unique = newItems
      .filter((item) => item.date && !existing.has(item.date))
      .sort((a, b) => b.date.localeCompare(a.date))
    items.value.push(...unique)
    items.value.sort((a, b) => b.date.localeCompare(a.date))
    return unique.length
  }

  async function loadNextMonth() {
    if (loading.value || noMore.value) return false

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
      error.value = '历史壁纸加载失败，请稍后重试。'
      return false
    } finally {
      loading.value = false
    }
  }

  async function loadInitial() {
    if (loading.value || items.value.length) return
    const now = currentMonth()
    cursor = now
    initialLoading.value = true
    await loadNextMonth()
    initialLoading.value = false
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
    retry,
    dataBaseUrl: DATA_BASE_URL,
  }
}
