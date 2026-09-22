/**
 * 颜色搜索工具
 */

export const COLOR_OPTIONS = [
  // --- 红色系 (Hue ≈ 0°) ---
  { name: '红色', value: '#e74c3c' },     // 高饱和鲜红 (H:6, S:0.74, V:0.91)
  { name: '粉色', value: '#ff75a0' },     // 明亮粉红 (H:341, S:0.54, V:1.0)

  // --- 橙/棕/黄系 (Hue: 30° ~ 60°) ---
  { name: '橙色', value: '#e67e22' },     // 鲜橙色 (H:28, S:0.85, V:0.90)
  { name: '棕色', value: '#795548' },     // 大地棕/木色 (H:16, S:0.41, V:0.47)
  { name: '黄色', value: '#f1c40f' },     // 明黄 (H:48, S:0.94, V:0.95)

  // --- 绿/青系 (Hue: 90° ~ 180°) ---
  { name: '绿色', value: '#2ecc71' },     // 翠绿 (H:145, S:0.77, V:0.80)
  { name: '青色', value: '#16a085' },     // 青/翡翠绿 (H:168, S:0.86, V:0.63)

  // --- 蓝系 (Hue: 210° ~ 240°) ---
  { name: '浅蓝', value: '#3498db' },     // 天蓝 (H:204, S:0.76, V:0.86)
  { name: '深蓝', value: '#1b3a4b' },     // 藏青/深蓝 (H:201, S:0.64, V:0.29)

  // --- 紫系 (Hue: 270° ~ 300°) ---
  { name: '紫色', value: '#8e44ad' },     // 紫色 (H:282, S:0.61, V:0.68)

  // --- 无彩色系 (S < 0.15 触发灰度逻辑) ---
  { name: '白色', value: '#ffffff' },     // 高亮纯白 (S:0, V:1.0)
  { name: '浅灰', value: '#d6dbdf' },     // 明亮浅灰 (S:0.03, V:0.87)
  { name: '深灰', value: '#566573' },     // 工业深灰 (S:0.25, V:0.45)
  { name: '黑色', value: '#1c2833' },     // 深沉暗黑 (S:0.45, V:0.20)

  // --- 高频壁纸配色补充 ---
  { name: '暖黄', value: '#f9e79f' },     // 暖阳/室内光 (H:48, S:0.36, V:0.98)
  { name: '黛绿', value: '#2e4053' }      // 夜色山林/黛青 (H:210, S:0.44, V:0.33)
]

function hexToRgb(hex) {
  if (typeof hex !== 'string') {
    return null
  }

  const normalized = hex.replace('#', '')

  if (normalized.length !== 6) {
    return null
  }

  const num = parseInt(normalized, 16)

  if (!Number.isFinite(num)) {
    return null
  }

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
    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }

    h *= 60

    if (h < 0) {
      h += 360
    }
  }

  const s = max === 0 ? 0 : delta / max

  return {
    h,
    s,
    v: max
  }
}

function hsvDistance(a, b) {
  let h = Math.abs(a.h - b.h)
  h = Math.min(h, 360 - h)

  const hueWeight = Math.min(a.s, b.s) < 0.15
    ? 0.15
    : 1

  const s = Math.abs(a.s - b.s)
  const v = Math.abs(a.v - b.v)

  return (
    h * 1.2 * hueWeight +
    s * 120 +
    v * 80
  )
}

function colorDistance(c1, c2) {
  const rgb1 = hexToRgb(c1)
  const rgb2 = hexToRgb(c2)

  if (!rgb1 || !rgb2) {
    return 999
  }

  return hsvDistance(
    rgbToHsv(rgb1.r, rgb1.g, rgb1.b),
    rgbToHsv(rgb2.r, rgb2.g, rgb2.b)
  )
}

function getColors(color) {
  if (!color) {
    return []
  }

  return Object.entries(color)
}

function getTypeWeight(type, target) {
  const rgb = hexToRgb(target)

  if (!rgb) {
    return 1
  }

  const hsv = rgbToHsv(
    rgb.r,
    rgb.g,
    rgb.b
  )

  if (
    hsv.s > 0.55 &&
    hsv.v > 0.45
  ) {
    if (
      type === 'Vibrant' ||
      type === 'LightVibrant'
    ) {
      return 0.7
    }

    if (
      type === 'Muted' ||
      type === 'DarkMuted'
    ) {
      return 1.3
    }
  }

  if (hsv.v < 0.35) {
    if (
      type === 'DarkVibrant' ||
      type === 'DarkMuted'
    ) {
      return 0.7
    }
  }

  return 1
}

function getPaletteDistance(imageColor, targetColor) {
  const colors = getColors(imageColor)

  if (colors.length === 0) {
    return 999
  }

  return Math.min(
    ...colors.map(([type, color]) =>
      colorDistance(
        color,
        targetColor
      ) * getTypeWeight(
        type,
        targetColor
      )
    )
  )
}

function getHistogramBins(histogram) {
  if (
    !histogram ||
    histogram.version !== 1 ||
    !Array.isArray(histogram.bins) ||
    histogram.bins.length !== 108
  ) {
    return null
  }

  return histogram.bins
}

function getHistogramBinColor(index) {
  const valueBin = index % 3
  const saturationBin =
    Math.floor(index / 3) % 3
  const hueBin =
    Math.floor(index / 9)

  return {
    h: saturationBin === 0
      ? 0
      : (hueBin + 0.5) * 30,

    s:
      saturationBin === 0
        ? 0.075
        : saturationBin === 1
          ? 0.5
          : 0.833,

    v:
      valueBin === 0
        ? 0.167
        : valueBin === 1
          ? 0.5
          : 0.833
  }
}

export function getHistogramColorDistance(
  histogram,
  targetColor
) {
  const bins = getHistogramBins(histogram)

  if (!bins) {
    return 999
  }

  const rgb = hexToRgb(targetColor)

  if (!rgb) {
    return 999
  }

  const target = rgbToHsv(
    rgb.r,
    rgb.g,
    rgb.b
  )

  let totalWeight = 0
  let weightedDistance = 0

  for (let index = 0; index < bins.length; index++) {
    const weight = Number(bins[index]) || 0

    if (weight <= 0) {
      continue
    }

    const distance =
      hsvDistance(
        getHistogramBinColor(index),
        target
      )

    weightedDistance +=
      weight * distance

    totalWeight += weight
  }

  if (totalWeight === 0) {
    return 999
  }

  return (
    weightedDistance /
    totalWeight
  )
}

export function getColorDistance(
  imageColor,
  targetColor,
  histogram = null
) {
  const histogramDistance =
    getHistogramColorDistance(
      histogram,
      targetColor
    )

  const paletteDistance =
    getPaletteDistance(
      imageColor,
      targetColor
    )

  if (
    histogramDistance !== 999 &&
    paletteDistance !== 999
  ) {
    return (
      histogramDistance * 0.85 +
      paletteDistance * 0.15
    )
  }

  if (histogramDistance !== 999) {
    return histogramDistance
  }

  return paletteDistance
}

export function matchColor(
  imageColor,
  targetColor,
  histogram = null
) {
  return (
    getColorDistance(
      imageColor,
      targetColor,
      histogram
    ) < 65
  )
}
