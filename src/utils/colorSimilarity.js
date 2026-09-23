/**
 * 颜色搜索工具
 *
 * 预设颜色只负责“快速探索”，不是声称覆盖所有图片。
 * 精确颜色仍然通过 color input + HSV/直方图距离完成。
 */
export const COLOR_OPTIONS = [
  { name: '红色', value: '#e74c3c' },
  { name: '珊瑚', value: '#ff6f61' },
  { name: '粉色', value: '#ff75a0' },
  { name: '橙色', value: '#e67e22' },
  { name: '棕色', value: '#795548' },
  { name: '金色', value: '#d4a017' },
  { name: '黄色', value: '#f1c40f' },
  { name: '米色', value: '#d9c2a3' },
  { name: '黄绿色', value: '#8bc34a' },
  { name: '绿色', value: '#2ecc71' },
  { name: '橄榄绿', value: '#708238' },
  { name: '青色', value: '#16a085' },
  { name: '湖蓝', value: '#2aa7a1' },
  { name: '浅蓝', value: '#5dade2' },
  { name: '蓝色', value: '#3498db' },
  { name: '深蓝', value: '#1b3a4b' },
  { name: '藏青', value: '#243b53' },
  { name: '紫色', value: '#8e44ad' },
  { name: '紫罗兰', value: '#9b59b6' },
  { name: '白色', value: '#ffffff' },
  { name: '浅灰', value: '#d6dbdf' },
  { name: '深灰', value: '#555555' },
  { name: '黑色', value: '#222222' }
]

function hexToRgb(hex) {
  if (typeof hex !== 'string') return null

  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return null

  const num = parseInt(normalized, 16)
  if (!Number.isFinite(num)) return null

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

function rgbToHsv(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0

  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4

    h *= 60
    if (h < 0) h += 360
  }

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max
  }
}

function hsvDistance(a, b) {
  let h = Math.abs(a.h - b.h)
  h = Math.min(h, 360 - h)

  const hueWeight = Math.min(a.s, b.s) < 0.15 ? 0.15 : 1
  const s = Math.abs(a.s - b.s)
  const v = Math.abs(a.v - b.v)

  return h * 1.2 * hueWeight + s * 120 + v * 80
}

function colorDistance(c1, c2) {
  const rgb1 = hexToRgb(c1)
  const rgb2 = hexToRgb(c2)

  if (!rgb1 || !rgb2) return 999

  return hsvDistance(
    rgbToHsv(rgb1.r, rgb1.g, rgb1.b),
    rgbToHsv(rgb2.r, rgb2.g, rgb2.b)
  )
}

function getTypeWeight(type, target) {
  const rgb = hexToRgb(target)
  if (!rgb) return 1

  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)

  if (hsv.s > 0.55 && hsv.v > 0.45) {
    if (type === 'Vibrant' || type === 'LightVibrant') return 0.7
    if (type === 'Muted' || type === 'DarkMuted') return 1.3
  }

  if (hsv.v < 0.35) {
    if (type === 'DarkVibrant' || type === 'DarkMuted') return 0.7
  }

  return 1
}

function getPaletteDistance(imageColor, targetColor) {
  if (!imageColor || typeof imageColor !== 'object') return 999

  const colors = Object.entries(imageColor)
  if (!colors.length) return 999

  return Math.min(...colors.map(([type, color]) =>
    colorDistance(color, targetColor) * getTypeWeight(type, targetColor)
  ))
}

function getHistogramBins(histogram) {
  if (
    !histogram ||
    histogram.version !== 1 ||
    !Array.isArray(histogram.bins) ||
    histogram.bins.length !== 108
  ) return null

  return histogram.bins
}

function getHistogramBinColor(index) {
  const valueBin = index % 3
  const saturationBin = Math.floor(index / 3) % 3
  const hueBin = Math.floor(index / 9)

  return {
    h: saturationBin === 0 ? 0 : (hueBin + 0.5) * 30,
    s: saturationBin === 0 ? 0.075 : saturationBin === 1 ? 0.5 : 0.833,
    v: valueBin === 0 ? 0.167 : valueBin === 1 ? 0.5 : 0.833
  }
}

export function getHistogramColorDistance(histogram, targetColor) {
  const bins = getHistogramBins(histogram)
  if (!bins) return 999

  const rgb = hexToRgb(targetColor)
  if (!rgb) return 999

  const target = rgbToHsv(rgb.r, rgb.g, rgb.b)
  let totalWeight = 0
  let weightedDistance = 0

  for (let index = 0; index < bins.length; index++) {
    const weight = Number(bins[index]) || 0
    if (weight <= 0) continue

    weightedDistance += weight * hsvDistance(
      getHistogramBinColor(index),
      target
    )
    totalWeight += weight
  }

  return totalWeight === 0 ? 999 : weightedDistance / totalWeight
}

export function getColorDistance(imageColor, targetColor, histogram = null) {
  const histogramDistance = getHistogramColorDistance(histogram, targetColor)
  const paletteDistance = getPaletteDistance(imageColor, targetColor)

  if (histogramDistance !== 999 && paletteDistance !== 999) {
    return histogramDistance * 0.85 + paletteDistance * 0.15
  }

  return histogramDistance !== 999 ? histogramDistance : paletteDistance
}

export function matchColor(imageColor, targetColor, histogram = null) {
  return getColorDistance(imageColor, targetColor, histogram) < 65
}
