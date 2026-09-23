import { computed, ref } from 'vue'

import { getColorDistance } from '../utils/colorSimilarity'

const COLOR_MATCH_THRESHOLD = 65

export function useWallpaperSearch(items, historyIndex = null) {
  const keyword = ref('')
  const date = ref('')
  const color = ref('')
  const scope = ref('loaded')

  const searching = computed(() => {
    return Boolean(keyword.value || date.value || color.value)
  })

  const loadedResult = computed(() => {
    let list = items.value.filter(item => {
      if (keyword.value) {
        const text = `${item.title || ''}${item.description || ''}`.toLowerCase()
        if (!text.includes(keyword.value.toLowerCase())) return false
      }

      if (date.value && !item.date.includes(date.value)) return false

      if (color.value) {
        const distance = getColorDistance(
          item.color,
          color.value,
          item.colorHistogram
        )

        if (distance > COLOR_MATCH_THRESHOLD) return false
      }

      return true
    })

    if (color.value) {
      list = [...list].sort((a, b) => {
        return getColorDistance(a.color, color.value, a.colorHistogram) -
          getColorDistance(b.color, color.value, b.colorHistogram)
      })
    }

    return list
  })

  const historyDates = computed(() => {
    if (!historyIndex || color.value) return []
    return historyIndex.search(keyword.value, date.value)
  })

  const result = computed(() => loadedResult.value)

  function clear() {
    keyword.value = ''
    date.value = ''
    color.value = ''
  }

  function setScope(value) {
    scope.value = value === 'all' ? 'all' : 'loaded'

    // 全历史索引不包含颜色直方图，因此切换到 all 时清掉颜色条件。
    if (scope.value === 'all') {
      color.value = ''
    }
  }

  return {
    keyword,
    date,
    color,
    scope,
    searching,
    result,
    loadedResult,
    historyDates,
    clear,
    setScope
  }
}
