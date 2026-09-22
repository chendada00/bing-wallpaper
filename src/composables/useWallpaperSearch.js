import {
  computed,
  ref
} from 'vue'

import {
  getColorDistance
} from '../utils/colorSimilarity'

const COLOR_MATCH_THRESHOLD = 65

export function useWallpaperSearch(items) {
  const keyword = ref('')
  const date = ref('')
  const color = ref('')

  const searching = computed(() => {
    return Boolean(
      keyword.value ||
      date.value ||
      color.value
    )
  })

  const result = computed(() => {
    let list = items.value.filter(item => {
      if (keyword.value) {
        const text = (
          item.title +
          item.description
        ).toLowerCase()

        if (
          !text.includes(
            keyword.value.toLowerCase()
          )
        ) {
          return false
        }
      }

      if (date.value) {
        if (
          !item.date.includes(
            date.value
          )
        ) {
          return false
        }
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
      list.sort((a, b) => {
        return (
          getColorDistance(
            a.color,
            color.value,
            a.colorHistogram
          ) -
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

  function clear() {
    keyword.value = ''
    date.value = ''
    color.value = ''
  }

  return {
    keyword,
    date,
    color,
    result,
    searching,
    clear
  }
}
