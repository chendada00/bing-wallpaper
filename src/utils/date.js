export function pad2(value) {
  return String(value).padStart(2, '0')
}

export function monthKey(year, month) {
  return `${year}-${pad2(month)}`
}

export function previousMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

export function formatDate(date) {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  return `${year}.${month}.${day}`
}

export function formatMonthLabel(year, month) {
  return `${year} 年 ${month} 月`
}

export function currentMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
