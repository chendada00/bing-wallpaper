import {
  computed,
  ref,
  watch
} from 'vue'

import {
  getColorDistance
} from '../utils/colorSimilarity'

import {
  matchesSearchText
} from '../utils/searchText'

const COLOR_MATCH_THRESHOLD = 65

const HISTORY_PAGE_SIZE = 60

export function useWallpaperSearch(
  items,
  historyItems = ref([])
) {

  const keyword = ref('')

  const date = ref('')

  const color = ref('')

  const scope = ref('loaded')

  const historyVisibleCount =
    ref(HISTORY_PAGE_SIZE)


  const loadedResult = computed(() => {

    let list =
      items.value.filter(item => {

        const searchableText =
          `${item.title || ''} ${item.description || ''}`

        if (
          keyword.value &&
          !matchesSearchText(
            searchableText,
            keyword.value
          )
        ) {
          return false
        }

        if (
          date.value &&
          !item.date.includes(date.value)
        ) {
          return false
        }

        if (color.value) {

          const distance =
            getColorDistance(
              item.color,
              color.value,
              item.colorHistogram
            )

          if (
            distance >
            COLOR_MATCH_THRESHOLD
          ) {
            return false
          }
        }

        return true
      })


    if (color.value) {

      list =
        [...list].sort((a, b) => {

          return (
            getColorDistance(
              a.color,
              color.value,
              a.colorHistogram
            )
            -
            getColorDistance(
              b.color,
              color.value,
              b.colorHistogram
            )
          )

        })
    }

    return list
  })


  const historyTotal =
    computed(() =>
      historyItems.value.length
    )


  const historyResult =
    computed(() =>
      historyItems.value.slice(
        0,
        historyVisibleCount.value
      )
    )


  const searching =
    computed(() => {

      return Boolean(
        keyword.value ||
        date.value ||
        color.value
      )

    })


  const result =
    computed(() => {

      if (!searching.value) {
        return items.value
      }

      return scope.value === 'all'
        ? historyResult.value
        : loadedResult.value

    })


  function loadMoreHistoryResults() {

    historyVisibleCount.value =
      Math.min(
        historyVisibleCount.value +
          HISTORY_PAGE_SIZE,

        historyTotal.value
      )
  }


  function resetHistoryPagination() {

    historyVisibleCount.value =
      HISTORY_PAGE_SIZE
  }


  watch(
    [keyword, date, scope],
    resetHistoryPagination
  )


  function clear() {

    keyword.value = ''

    date.value = ''

    color.value = ''

    resetHistoryPagination()
  }


  return {

    keyword,

    date,

    color,

    scope,

    result,

    loadedResult,

    historyTotal,

    historyVisibleCount,

    searching,

    loadMoreHistoryResults,

    resetHistoryPagination,

    clear
  }
}