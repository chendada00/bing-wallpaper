import { ref } from 'vue'

export function useHistoryIndex(dataBaseUrl) {
  const index = ref(null)
  const loading = ref(false)
  const error = ref('')
  let pending = null

  async function load() {
    if (index.value) return index.value
    if (pending) return pending

    loading.value = true
    error.value = ''

    pending = fetch(`${dataBaseUrl}/data/index.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        if (
          !data ||
          data.version !== 1 ||
          !Array.isArray(data.items)
        ) {
          throw new Error('Invalid history index')
        }

        index.value = data
        return data
      })
      .catch(err => {
        error.value = '历史索引加载失败，请稍后重试。'
        throw err
      })
      .finally(() => {
        loading.value = false
        pending = null
      })

    return pending
  }

  function search(keyword = '', date = '') {
    if (!index.value) return []

    const query = String(keyword).trim().toLowerCase()
    const dateQuery = String(date).trim()

    return index.value.items
      .filter(item => {
        if (!Array.isArray(item) || item.length < 1) {
          return false
        }

        const itemDate = String(item[0] || '')
        const title = String(item[1] || '').toLowerCase()
        const description = String(item[2] || '').toLowerCase()

        if (dateQuery && !itemDate.includes(dateQuery)) {
          return false
        }

        if (
          query &&
          !title.includes(query) &&
          !description.includes(query)
        ) {
          return false
        }

        return true
      })
      .map(item => String(item[0]))
  }

  return {
    index,
    loading,
    error,
    load,
    search
  }
}
