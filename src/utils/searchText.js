export function normalizeSearchText(value = '') {
    return String(value)
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s\u200B\uFEFF]+/g, '')
      .replace(/[，。、“”‘’：；！？、（）【】《》〈〉「」『』…·・\-—_]/g, '')
  }
  
  export function matchesSearchText(text, keyword) {
    const query = normalizeSearchText(keyword)
  
    if (!query) {
      return true
    }
  
    return normalizeSearchText(text).includes(query)
  }