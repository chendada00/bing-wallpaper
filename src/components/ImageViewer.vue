<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="viewer"
      :style="viewerStyle"
      @click.self="close"
    >
      <!-- =====================================================
       * 主色调氛围背景
       * ===================================================== -->
      <div
        class="viewer-color-bg"
        :style="colorBackgroundStyle"
      />

      <!-- 深色遮罩 -->
      <div class="viewer-overlay" />

      <!-- =====================================================
       * 关闭按钮
       * ===================================================== -->
      <button
        class="viewer-close"
        aria-label="关闭"
        @click="close"
      >
        ×
      </button>

      <!-- =====================================================
       * 上一张
       * ===================================================== -->
      <button
        v-if="hasPrevious"
        class="viewer-nav viewer-prev"
        aria-label="上一张"
        @click="previous"
      >
        ‹
      </button>

      <!-- =====================================================
       * 下一张
       * ===================================================== -->
      <button
        v-if="hasNext"
        class="viewer-nav viewer-next"
        aria-label="下一张"
        @click="next"
      >
        ›
      </button>

      <!-- =====================================================
       * 唯一滚动区域
       * ===================================================== -->
      <div class="viewer-scroll">
        <div class="viewer-content">

          <!-- ===================================================
           * 显示器
           * =================================================== -->
          <div class="viewer-monitor">

            <!-- 显示器主体 -->
            <div class="viewer-monitor-bezel">

              <!-- ================================
               * 屏幕
               * ================================ -->
              <div class="viewer-image-wrapper">

                <!-- Base64 模糊占位图 -->
                <img
                  v-if="placeholderImage"
                  :src="placeholderImage"
                  :alt="item?.title || item?.date"
                  class="viewer-image viewer-placeholder"
                >

                <!-- 高清图片 -->
                <img
                  v-if="highResLoaded && activeHighResUrl"
                  :src="activeHighResUrl"
                  :alt="item?.title || item?.date"
                  class="viewer-image viewer-high-res"
                >

                <!-- 高清图加载 -->
                <div
                  v-if="imageLoading"
                  class="viewer-loading"
                >
                  <span class="viewer-spinner" />

                  <span class="viewer-loading-text">
                    正在加载高清壁纸...
                  </span>
                </div>

                <!-- 高清图加载失败 -->
                <div
                  v-if="imageError"
                  class="viewer-error"
                >
                  高清图片加载失败
                </div>
              </div>

              <!-- ================================
               * 顶部摄像头
               * ================================ -->
              <span
                class="viewer-monitor-camera"
                aria-hidden="true"
              />

              <!-- ================================
               * 品牌装饰线
               * ================================ -->
              <span
                class="viewer-monitor-brand"
                aria-hidden="true"
              />


            </div>

            <!-- ================================
             * 显示器支架
             * ================================ -->
            <div
              class="viewer-monitor-stand"
              aria-hidden="true"
            >
              <div class="viewer-monitor-neck" />
              <div class="viewer-monitor-base" />
            </div>
          </div>

          <!-- ===================================================
           * 图片信息
           * =================================================== -->
          <div class="viewer-info">

            <!-- 日期 + 序号 -->
            <div class="viewer-meta">
              <span class="viewer-date">
                {{ item?.date }}
              </span>

              <span
                v-if="currentIndex >= 0"
                class="viewer-counter"
              >
                {{ currentIndex + 1 }} / {{ items.length }}
              </span>
            </div>

            <!-- 标题 -->
            <h2>
              {{ item?.title || 'Bing Wallpaper' }}
            </h2>

            <!-- 描述 -->
            <p>
              {{ item?.description || item?.copyright || '' }}
            </p>

            <!-- =================================================
             * 主色调
             * ================================================= -->
            <div
              v-if="colorPalette.length"
              class="viewer-colors"
            >
              <div class="viewer-colors-title">
                主色调
              </div>

              <div class="viewer-color-list">
                <button
                  v-for="color in colorPalette"
                  :key="color"
                  class="viewer-color"
                  :class="{
                    copied: copiedColor === color
                  }"
                  :title="`复制 ${color}`"
                  @click="copyColor(color)"
                >
                  <span
                    class="color-preview"
                    :style="{
                      backgroundColor: color
                    }"
                  />

                  <span class="color-name">
                    {{ color.toUpperCase() }}
                  </span>

                  <span class="color-copy">
                    {{
                      copiedColor === color
                        ? '✓'
                        : '复制'
                    }}
                  </span>
                </button>
              </div>
            </div>

            <!-- =================================================
             * 操作
             * ================================================= -->
            <div class="viewer-actions">

              <!-- 下载原图 -->
              <button
                class="download-button"
                :disabled="downloading"
                @click="downloadImage"
              >
                <span
                  v-if="downloading"
                  class="download-progress-content"
                >
                  <span class="download-progress-track">
                    <span
                      class="download-progress-bar"
                      :style="{
                        width: `${downloadProgress}%`
                      }"
                    />
                  </span>

                  <span class="download-progress-text">
                    <template v-if="downloadTotal">
                      {{ downloadProgress }}%
                      ·
                      {{ formatBytes(downloadLoaded) }}
                      /
                      {{ formatBytes(downloadTotal) }}
                    </template>

                    <template v-else>
                      下载中...
                    </template>
                  </span>
                </span>

                <span v-else>
                  下载原图
                </span>
              </button>

              <!-- 打开原图 -->
              <a
                v-if="highResImageUrl"
                class="open-button"
                :href="highResImageUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                打开原图
              </a>

              <!-- 查看详情 -->
              <button
                v-if="item?.date"
                class="detail-button"
                type="button"
                @click="openDetail"
              >
                <span aria-hidden="true">↗</span>
                查看详情
              </button>
            </div>

            <!-- =================================================
             * 颜色分布
             * ================================================= -->
            <div
              v-if="histogramCells.length"
              class="viewer-histogram"
            >
              <div class="viewer-section-title">
                <span>颜色分布</span>

                <span class="viewer-section-meta">
                  108 个 HSV 色彩区域
                </span>
              </div>

              <div class="histogram-description">
                统计整张图片的颜色组成，不对应图片中的空间位置。
              </div>

              <div class="histogram-wrapper">

                <!-- Hue 横轴 -->
                <div class="histogram-hue-axis">
                  <span
                    v-for="hue in HISTOGRAM_HUES"
                    :key="hue.name"
                    class="histogram-hue-label"
                  >
                    {{ hue.name }}
                  </span>
                </div>

                <div class="histogram-main">

                  <!-- 左侧 Saturation / Value 标签 -->
                  <div class="histogram-row-labels">
                    <span
                      v-for="row in HISTOGRAM_ROWS"
                      :key="row.key"
                      class="histogram-row-label"
                    >
                      {{ row.label }}
                    </span>
                  </div>

                  <!-- 108 个颜色区域 -->
                  <div class="histogram-grid">
                    <button
                      v-for="(cell, index) in histogramCells"
                      :key="index"
                      type="button"
                      class="histogram-cell"
                      :class="{
                        active:
                          hoveredHistogramIndex === index
                      }"
                      :style="{
                        backgroundColor: cell.color,
                        opacity: cell.opacity
                      }"
                      :aria-label="cell.description"
                      @mouseenter="
                        hoveredHistogramIndex = index
                      "
                      @mouseleave="
                        hoveredHistogramIndex = -1
                      "
                      @focus="
                        hoveredHistogramIndex = index
                      "
                      @blur="
                        hoveredHistogramIndex = -1
                      "
                    />
                  </div>
                </div>
              </div>

              <!-- 当前格子详细信息 -->
              <div class="histogram-hover-info">
                <template v-if="hoveredHistogramCell">
                  <span
                    class="histogram-hover-color"
                    :style="{
                      backgroundColor:
                        hoveredHistogramCell.color
                    }"
                  />

                  <span class="histogram-hover-main">
                    {{ hoveredHistogramCell.hueName }}
                    ·
                    {{ hoveredHistogramCell.saturationName }}
                    ·
                    {{ hoveredHistogramCell.valueName }}
                  </span>

                  <span class="histogram-hover-range">
                    Hue {{ hoveredHistogramCell.hueRange }}
                  </span>

                  <strong>
                    {{ hoveredHistogramCell.percentage }}%
                  </strong>
                </template>

                <template v-else>
                  <span class="histogram-hover-placeholder">
                    将鼠标移动到色彩区域，可查看该区域的颜色和像素占比
                  </span>
                </template>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

import {
  getHighResImageUrl,
  getStableHighResImageUrl
} from '../utils/image'

const highResImageUrl = computed(() => {
  return getHighResImageUrl(
    props.item
  )
})

const stableHighResImageUrl = computed(() => {
  return getStableHighResImageUrl(
    props.item
  )
})

const props = defineProps({
  item: {
    type: Object,
    default: null
  },

  visible: {
    type: Boolean,
    default: false
  },

  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'close',
  'change',
  'open-detail'
])

/*
 * 高清图是否已经加载完成
 */
const highResLoaded = ref(false)

const activeHighResUrl =
  ref('')

let triedMirror = false

/*
 * 高清图是否正在加载
 */
const imageLoading = ref(false)

/*
 * 高清图是否加载失败
 */
const imageError = ref(false)

/*
 * 高清图预加载对象
 */
let preloadImage = null

/*
 * 防止快速切换图片时旧请求影响当前状态
 */
let loadToken = 0

/*
 * 下载状态
 */
const downloading = ref(false)

const downloadProgress = ref(0)

const downloadLoaded = ref(0)

const downloadTotal = ref(0)

/*
 * =========================================================
 * 直方图 Hue
 * =========================================================
 */
const HISTOGRAM_HUES = [
  { name: '红', range: '0°–30°' },
  { name: '橙', range: '30°–60°' },
  { name: '黄', range: '60°–90°' },
  { name: '黄绿', range: '90°–120°' },
  { name: '绿', range: '120°–150°' },
  { name: '青绿', range: '150°–180°' },
  { name: '青', range: '180°–210°' },
  { name: '蓝', range: '210°–240°' },
  { name: '蓝紫', range: '240°–270°' },
  { name: '紫', range: '270°–300°' },
  { name: '品红', range: '300°–330°' },
  { name: '玫红', range: '330°–360°' }
]

/*
 * =========================================================
 * 直方图 Saturation / Value
 * =========================================================
 */
const HISTOGRAM_ROWS = [
  {
    key: 'low-dark',
    label: '低饱和 · 暗',
    saturation: 0,
    value: 0
  },
  {
    key: 'low-medium',
    label: '低饱和 · 中',
    saturation: 0,
    value: 1
  },
  {
    key: 'low-bright',
    label: '低饱和 · 亮',
    saturation: 0,
    value: 2
  },
  {
    key: 'medium-dark',
    label: '中饱和 · 暗',
    saturation: 1,
    value: 0
  },
  {
    key: 'medium-medium',
    label: '中饱和 · 中',
    saturation: 1,
    value: 1
  },
  {
    key: 'medium-bright',
    label: '中饱和 · 亮',
    saturation: 1,
    value: 2
  },
  {
    key: 'high-dark',
    label: '高饱和 · 暗',
    saturation: 2,
    value: 0
  },
  {
    key: 'high-medium',
    label: '高饱和 · 中',
    saturation: 2,
    value: 1
  },
  {
    key: 'high-bright',
    label: '高饱和 · 亮',
    saturation: 2,
    value: 2
  }
]

const SATURATION_VALUES = [25, 60, 90]

const VALUE_VALUES = [35, 65, 92]

/*
 * =========================================================
 * 查看详情
 * =========================================================
 */
function openDetail() {
  if (!props.item?.date) {
    return
  }

  emit('open-detail', props.item)
}

/*
 * =========================================================
 * 生成 108 个直方图色彩区域
 * =========================================================
 */
const histogramCells = computed(() => {
  const histogram = props.item?.colorHistogram

  if (
    !histogram ||
    histogram.version !== 1 ||
    !Array.isArray(histogram.bins) ||
    histogram.bins.length !== 108
  ) {
    return []
  }

  const bins = histogram.bins

  const total = bins.reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  )

  const max = Math.max(
    ...bins.map(value => Number(value) || 0),
    1
  )

  const cells = []

  /*
   * 视觉顺序：
   *
   * 9 行：
   * Saturation × Value
   *
   * 12 列：
   * Hue
   */
  for (const row of HISTOGRAM_ROWS) {
    for (let hue = 0; hue < 12; hue += 1) {
      const index =
        hue * 9 +
        row.saturation * 3 +
        row.value

      const weight = Number(bins[index]) || 0

      const hueDegrees = hue * 30

      const saturation =
        SATURATION_VALUES[row.saturation]

      const value =
        VALUE_VALUES[row.value]

      const percentage = total > 0
        ? weight / total * 100
        : 0

      const saturationName = [
        '低饱和度',
        '中饱和度',
        '高饱和度'
      ][row.saturation]

      const valueName = [
        '暗',
        '中',
        '亮'
      ][row.value]

      cells.push({
        color:
          `hsl(${hueDegrees} ${saturation}% ${value}%)`,

        opacity:
          weight > 0
            ? 0.22 + (weight / max) * 0.78
            : 0.08,

        weight,

        percentage:
          percentage.toFixed(1),

        hueName:
          HISTOGRAM_HUES[hue].name,

        hueRange:
          HISTOGRAM_HUES[hue].range,

        saturationName,

        valueName,

        description:
          `${HISTOGRAM_HUES[hue].name} · ` +
          `${HISTOGRAM_HUES[hue].range} · ` +
          `${saturationName} · ` +
          `${valueName} · ` +
          `${percentage.toFixed(1)}%`
      })
    }
  }

  return cells
})

/*
 * 当前 hover 的直方图格子
 */
const hoveredHistogramIndex = ref(-1)

const hoveredHistogramCell = computed(() => {
  if (hoveredHistogramIndex.value < 0) {
    return null
  }

  return (
    histogramCells.value[
      hoveredHistogramIndex.value
    ] || null
  )
})

/*
 * =========================================================
 * 当前复制成功的颜色
 * =========================================================
 */
const copiedColor = ref('')

/*
 * =========================================================
 * 当前图片索引
 * =========================================================
 */
const currentIndex = computed(() => {
  if (!props.item) {
    return -1
  }

  return props.items.findIndex(
    item => item.date === props.item.date
  )
})

/*
 * 是否存在上一张
 */
const hasPrevious = computed(() => {
  return currentIndex.value > 0
})

/*
 * 是否存在下一张
 */
const hasNext = computed(() => {
  return (
    currentIndex.value >= 0 &&
    currentIndex.value < props.items.length - 1
  )
})

/*
 * =========================================================
 * Base64 占位图
 * =========================================================
 */
const placeholderImage = computed(() => {
  return props.item?.base64 || ''
})

/*
 * =========================================================
 * 主色调优先级
 * =========================================================
 */
const colorPriority = [
  'Vibrant',
  'LightVibrant',
  'DarkVibrant',
  'Muted',
  'LightMuted',
  'DarkMuted'
]

/*
 * =========================================================
 * 获取多个主色调
 * =========================================================
 */
const colorPalette = computed(() => {
  const colors = props.item?.color || {}

  const result = []

  for (const key of colorPriority) {
    const value = colors[key]

    if (
      typeof value !== 'string' ||
      !/^#[0-9a-fA-F]{6}$/.test(value)
    ) {
      continue
    }

    const normalized = value.toUpperCase()

    if (!result.includes(normalized)) {
      result.push(normalized)
    }
  }

  return result
})

/*
 * =========================================================
 * 第一个主色调
 * =========================================================
 */
const primaryColor = computed(() => {
  return colorPalette.value[0] || ''
})

/*
 * =========================================================
 * HEX → RGBA
 * =========================================================
 */
function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '')

  const red = parseInt(
    value.slice(0, 2),
    16
  )

  const green = parseInt(
    value.slice(2, 4),
    16
  )

  const blue = parseInt(
    value.slice(4, 6),
    16
  )

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/*
 * =========================================================
 * Viewer CSS 变量
 * =========================================================
 */
const viewerStyle = computed(() => {
  return {
    '--viewer-color':
      primaryColor.value || '#667085'
  }
})

/*
 * =========================================================
 * 多主色调背景
 * =========================================================
 */
const colorBackgroundStyle = computed(() => {
  const colors = colorPalette.value

  if (!colors.length) {
    return {
      opacity: '0'
    }
  }

  const positions = [
    ['18%', '16%'],
    ['84%', '18%'],
    ['78%', '84%'],
    ['18%', '82%']
  ]

  const gradients = colors
    .slice(0, 4)
    .map((color, index) => {
      const position = positions[index]

      return `
        radial-gradient(
          circle at ${position[0]} ${position[1]},
          ${hexToRgba(color, 0.62)} 0%,
          ${hexToRgba(color, 0.24)} 30%,
          transparent 68%
        )
      `
    })

  return {
    background: gradients.join(','),
    opacity: '0.72'
  }
})

/*
 * =========================================================
 * 初始化当前图片
 *
 * 加载流程：
 *
 * Base64
 *   ↓
 * 高清图后台预加载
 *   ↓
 * 高清图完整加载
 *   ↓
 * 显示高清图
 * =========================================================
 */
function loadCurrentImage() {
  loadToken += 1

  const currentToken =
    loadToken

  if (preloadImage) {
    preloadImage.onload = null
    preloadImage.onerror = null
    preloadImage = null
  }

  copiedColor.value = ''

  highResLoaded.value = false

  imageLoading.value = false

  imageError.value = false

  activeHighResUrl.value = ''

  triedMirror = false

  if (!highResImageUrl.value) {
    return
  }

  imageLoading.value = true

  const imageDate =
    props.item?.date

  function loadUrl(
    url,
    isMirror = false
  ) {
    if (!url) {
      imageLoading.value = false
      imageError.value = true
      return
    }

    const image =
      new Image()

    preloadImage = image

    image.onload = () => {
      if (
        currentToken !== loadToken ||
        props.item?.date !== imageDate
      ) {
        return
      }

      activeHighResUrl.value =
        url

      highResLoaded.value =
        true

      imageLoading.value =
        false

      imageError.value =
        false

      preloadImage = null
    }

    image.onerror = () => {
      if (
        currentToken !== loadToken ||
        props.item?.date !== imageDate
      ) {
        return
      }

      /*
       * 官方 UHD 失败：
       *
       * sourceImage
       *      ↓
       * image
       *
       * 只允许 fallback 一次。
       */
      if (
        !isMirror &&
        props.item?.image &&
        props.item.image !== url &&
        !triedMirror
      ) {
        triedMirror = true

        loadUrl(
          props.item.image,
          true
        )

        return
      }

      highResLoaded.value =
        false

      imageLoading.value =
        false

      imageError.value =
        true

      activeHighResUrl.value =
        ''

      preloadImage = null
    }

    image.src = url
  }

  loadUrl(
    highResImageUrl.value
  )
}
/*
 * =========================================================
 * 关闭
 * =========================================================
 */
function close() {
  emit('close')
}

/*
 * =========================================================
 * 上一张
 * =========================================================
 */
function previous() {
  if (!hasPrevious.value) {
    return
  }

  emit(
    'change',
    props.items[
      currentIndex.value - 1
    ]
  )
}

/*
 * =========================================================
 * 下一张
 * =========================================================
 */
function next() {
  if (!hasNext.value) {
    return
  }

  emit(
    'change',
    props.items[
      currentIndex.value + 1
    ]
  )
}

/*
 * =========================================================
 * 键盘控制
 * =========================================================
 */
function handleKeydown(event) {
  if (!props.visible) {
    return
  }

  /*
   * ESC
   */
  if (event.key === 'Escape') {
    event.preventDefault()

    close()

    return
  }

  /*
   * 左箭头
   */
  if (event.key === 'ArrowLeft') {
    event.preventDefault()

    previous()

    return
  }

  /*
   * 右箭头
   */
  if (event.key === 'ArrowRight') {
    event.preventDefault()

    next()
  }
}

/*
 * =========================================================
 * 复制颜色
 * =========================================================
 */
async function copyColor(color) {
  if (!color) {
    return
  }

  const value = color.toUpperCase()

  /*
   * 优先使用 Clipboard API
   */
  try {
    await navigator.clipboard.writeText(value)

    copiedColor.value = value

    setTimeout(() => {
      if (copiedColor.value === value) {
        copiedColor.value = ''
      }
    }, 1800)

    return
  } catch (error) {
    console.warn(
      'Clipboard API 复制失败，尝试兼容方案:',
      error
    )
  }

  /*
   * 兼容方案
   */
  try {
    const textarea =
      document.createElement('textarea')

    textarea.value = value

    textarea.style.position = 'fixed'

    textarea.style.left = '-9999px'

    textarea.style.top = '0'

    document.body.appendChild(textarea)

    textarea.focus()

    textarea.select()

    const success =
      document.execCommand('copy')

    textarea.remove()

    if (!success) {
      throw new Error('复制操作失败')
    }

    copiedColor.value = value

    setTimeout(() => {
      if (copiedColor.value === value) {
        copiedColor.value = ''
      }
    }, 1800)
  } catch (error) {
    console.error(
      '复制颜色失败:',
      error
    )
  }
}

/*
 * =========================================================
 * 下载原图
 * =========================================================
 */
async function downloadImage() {
  if (
    !props.item?.image ||
    downloading.value
  ) {
    return
  }

  downloading.value = true

  downloadProgress.value = 0

  downloadLoaded.value = 0

  downloadTotal.value = 0

  try {
    const downloadUrl =
      stableHighResImageUrl.value

    if (!downloadUrl) {
      return
    }

    const response =
      await fetch(downloadUrl)

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      )
    }

    /*
     * 某些浏览器 / CDN 环境可能没有 ReadableStream。
     */
    if (!response.body) {
      const blob =
        await response.blob()

      triggerDownload(blob)

      return
    }

    const contentLength =
      response.headers.get(
        'Content-Length'
      )

    const total =
      Number(contentLength)

    downloadTotal.value =
      Number.isFinite(total)
        ? total
        : 0

    const reader =
      response.body.getReader()

    const chunks = []

    let received = 0

    while (true) {
      const {
        done,
        value
      } = await reader.read()

      if (done) {
        break
      }

      chunks.push(value)

      received += value.length

      downloadLoaded.value =
        received

      if (total > 0) {
        downloadProgress.value =
          Math.min(
            100,
            Math.round(
              received / total * 100
            )
          )
      }
    }

    const blob =
      new Blob(chunks)

    /*
     * 没有 Content-Length 时，
     * 下载完成后才可以确定 100%。
     */
    if (total <= 0) {
      downloadProgress.value = 100
    }

    triggerDownload(blob)
  } catch (error) {
    console.error(
      '下载失败:',
      error
    )

    window.open(
      stableHighResImageUrl.value,
      '_blank',
      'noopener,noreferrer'
    )
  } finally {
    setTimeout(() => {
      downloading.value = false

      downloadProgress.value = 0

      downloadLoaded.value = 0

      downloadTotal.value = 0
    }, 500)
  }
}

/*
 * =========================================================
 * 触发浏览器下载
 * =========================================================
 */
function triggerDownload(blob) {
  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url

  link.download =
    `${props.item?.date || 'bing-wallpaper'}.jpg`

  document.body.appendChild(link)

  link.click()

  link.remove()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

/*
 * =========================================================
 * 格式化文件大小
 * =========================================================
 */
function formatBytes(bytes) {
  if (!bytes) {
    return ''
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return `${(
    bytes / 1024 / 1024
  ).toFixed(1)} MB`
}

/*
 * =========================================================
 * 当前图片发生变化
 * =========================================================
 */
watch(
  () => props.item,
  () => {
    loadCurrentImage()
  },
  {
    immediate: true
  }
)

/*
 * =========================================================
 * 生命周期
 * =========================================================
 */
onMounted(() => {
  window.addEventListener(
    'keydown',
    handleKeydown
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'keydown',
    handleKeydown
  )

  loadToken += 1

  if (preloadImage) {
    preloadImage.onload = null
    preloadImage.onerror = null
    preloadImage = null
  }
})
</script>

<style scoped>

/* =========================================================
 * 查看器整体
 * ========================================================= */

.viewer {
  position: fixed;

  inset: 0;

  z-index: 9999;

  width: 100%;
  height: 100vh;

  box-sizing: border-box;

  overflow: hidden;

  background:
    linear-gradient(
      180deg,
      rgba(8, 10, 14, 0.94),
      rgba(8, 10, 14, 0.97)
    );

  animation:
    viewer-in 0.25s ease;
}

@keyframes viewer-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}


/* =========================================================
 * 主色调氛围背景
 * ========================================================= */

.viewer-color-bg {
  position: absolute;

  inset: -20%;

  z-index: 0;

  pointer-events: none;

  filter:
    blur(100px)
    saturate(1.15);

  transform: scale(1.15);

  mix-blend-mode: screen;

  transition:
    background 0.7s ease,
    opacity 0.7s ease;
}


/* =========================================================
 * 深色遮罩
 * ========================================================= */

.viewer-overlay {
  position: absolute;

  inset: 0;

  z-index: 1;

  pointer-events: none;

  background:
    linear-gradient(
      180deg,
      rgba(8, 10, 14, 0.24),
      rgba(8, 10, 14, 0.42)
    );
}


/* =========================================================
 * 唯一滚动区域
 * ========================================================= */

.viewer-scroll {
  position: relative;

  z-index: 2;

  width: 100%;
  height: 100%;

  box-sizing: border-box;

  overflow-x: hidden;
  overflow-y: auto;

  padding:
    40px 24px 56px;

  overscroll-behavior: contain;

  -webkit-overflow-scrolling:
    touch;

  scrollbar-width: thin;

  scrollbar-color:
    rgba(255, 255, 255, 0.18)
    transparent;
}


/* =========================================================
 * WebKit 滚动条
 * ========================================================= */

.viewer-scroll::-webkit-scrollbar {
  width: 8px;
}

.viewer-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.viewer-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;

  background:
    rgba(255, 255, 255, 0.18);
}

.viewer-scroll::-webkit-scrollbar-thumb:hover {
  background:
    rgba(255, 255, 255, 0.28);
}


/* =========================================================
 * 内容
 * ========================================================= */

.viewer-content {
  position: relative;

  width: min(1200px, 100%);

  min-width: 0;

  min-height: 100%;

  margin: 0 auto;

  box-sizing: border-box;

  display: flex;

  flex-direction: column;

  align-items: center;
}


/* =========================================================
 * 显示器整体
 * ========================================================= */

.viewer-monitor {
  position: relative;

  width: min(1200px, 100%);

  margin:
    0 auto 34px;

  flex-shrink: 0;

  filter:
    drop-shadow(
      0 24px 45px
      rgba(0, 0, 0, 0.28)
    );
}


/* =========================================================
 * 显示器银白色外壳
 * ========================================================= */

.viewer-monitor-bezel {
  position: relative;

  width: 100%;

  box-sizing: border-box;

  padding:
    10px 10px 16px;

  border-radius: 15px;

  background:
    linear-gradient(
      145deg,
      #ffffff 0%,
      #f4f5f6 42%,
      #e5e7e9 100%
    );

  border:
    1px solid
    rgba(0, 0, 0, 0.12);

  box-shadow:
    inset 0 1px 0
      rgba(255, 255, 255, 0.95),
    inset 0 -1px 0
      rgba(0, 0, 0, 0.08),
    0 12px 28px
      rgba(0, 0, 0, 0.16);
}


/* =========================================================
 * 屏幕区域
 *
 * 注意：
 * 这里是整个文件中唯一的
 * .viewer-image-wrapper 定义。
 * ========================================================= */

.viewer-image-wrapper {
  position: relative;

  width: 100%;

  aspect-ratio: 16 / 9;

  display: flex;

  align-items: center;

  justify-content: center;

  overflow: hidden;

  flex-shrink: 0;

  background: #050607;

  border-radius: 6px;

  box-shadow:
    inset 0 0 0 1px
      rgba(0, 0, 0, 0.55),
    inset 0 0 18px
      rgba(0, 0, 0, 0.32);
}


/* =========================================================
 * 图片
 * ========================================================= */

.viewer-image {
  width: 100%;
  height: 100%;

  object-fit: contain;

  border-radius: 4px;

  user-select: none;

  -webkit-user-drag: none;

  box-shadow:
    0 20px 55px
      rgba(0, 0, 0, 0.30);

  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}


/* =========================================================
 * Base64 占位图
 * ========================================================= */

.viewer-placeholder {
  position: absolute;

  inset: 0;

  z-index: 1;
}


/* =========================================================
 * 高清图
 * ========================================================= */

.viewer-high-res {
  position: absolute;

  inset: 0;

  z-index: 2;

  animation:
    high-res-fade-in
    0.25s
    ease-out;
}

@keyframes high-res-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}


/* =========================================================
 * 顶部摄像头
 * ========================================================= */

.viewer-monitor-camera {
  position: absolute;

  left: 50%;

  top: 1px;

  width: 30px;

  height: 7px;

  transform:
    translateX(-50%);

  border-radius: 999px;

  background:
    linear-gradient(
      180deg,
      #5f6368 0%,
      #30343a 45%,
      #1c2024 100%
    );

  border:
    1px solid
    rgba(0, 0, 0, 0.30);

  box-shadow:
    inset 0 1px 0
      rgba(255, 255, 255, 0.28),
    0 1px 2px
      rgba(0, 0, 0, 0.20);

  z-index: 6;
}


/* 摄像头镜头 */

.viewer-monitor-camera::before {
  content: "";

  position: absolute;

  left: 50%;
  top: 50%;

  width: 4px;
  height: 4px;

  transform:
    translate(-50%, -50%);

  border-radius: 50%;

  background:
    radial-gradient(
      circle at 35% 30%,
      #c5d9eb 0%,
      #52677c 30%,
      #17202a 65%,
      #050607 100%
    );

  box-shadow:
    0 0 0 1px
      rgba(0, 0, 0, 0.65),
    0 0 5px
      rgba(100, 160, 210, 0.20);
}


/* 摄像头状态灯 */

.viewer-monitor-camera::after {
  content: "";

  position: absolute;

  right: 7px;

  top: 50%;

  width: 2px;
  height: 2px;

  transform:
    translateY(-50%);

  border-radius: 50%;

  background:
    rgba(120, 170, 205, 0.5);

  box-shadow:
    0 0 4px
      rgba(100, 170, 220, 0.25);
}


/* =========================================================
 * 显示器品牌装饰线
 * ========================================================= */

.viewer-monitor-brand {
  position: absolute;

  left: 50%;

  bottom: 5px;

  width: 26px;

  height: 2px;

  transform:
    translateX(-50%);

  border-radius: 999px;

  background:
    rgba(100, 105, 110, 0.35);

  box-shadow:
    0 1px 0
      rgba(255, 255, 255, 0.75);
}




/* =========================================================
 * Power 呼吸动画
 * ========================================================= */

@keyframes viewer-power-button-breath {
  0%,
  100% {
    box-shadow:
      inset 0 1px 1px
        rgba(255, 255, 255, 0.95),
      inset 0 -1px 1px
        rgba(0, 0, 0, 0.12),
      0 1px 2px
        rgba(0, 0, 0, 0.10),
      0 0 0
        rgba(140, 190, 220, 0);
  }

  50% {
    box-shadow:
      inset 0 1px 1px
        rgba(255, 255, 255, 0.95),
      inset 0 -1px 1px
        rgba(0, 0, 0, 0.12),
      0 1px 2px
        rgba(0, 0, 0, 0.10),
      0 0 8px
        rgba(130, 190, 225, 0.38);
  }
}


/* =========================================================
 * 显示器支架
 * ========================================================= */

.viewer-monitor-stand {
  position: relative;

  width: 180px;

  height: 34px;

  margin:
    -1px auto 0;

  display: flex;

  flex-direction: column;

  align-items: center;

  z-index: 1;
}


/* =========================================================
 * 支架连接杆
 * ========================================================= */

.viewer-monitor-neck {
  width: 34px;

  height: 24px;

  border-left:
    1px solid
    rgba(0, 0, 0, 0.10);

  border-right:
    1px solid
    rgba(0, 0, 0, 0.10);

  background:
    linear-gradient(
      90deg,
      #d9dcdf 0%,
      #f7f8f9 45%,
      #cfd2d5 100%
    );

  box-shadow:
    inset 1px 0
      rgba(255, 255, 255, 0.55),
    inset -1px 0
      rgba(0, 0, 0, 0.06);
}


/* =========================================================
 * 显示器底座
 * ========================================================= */

.viewer-monitor-base {
  width: 150px;

  height: 7px;

  margin-top: -1px;

  border-radius: 999px;

  background:
    linear-gradient(
      180deg,
      #f5f6f7 0%,
      #d6d9dc 100%
    );

  border:
    1px solid
    rgba(0, 0, 0, 0.10);

  box-shadow:
    inset 0 1px 0
      rgba(255, 255, 255, 0.90),
    0 3px 7px
      rgba(0, 0, 0, 0.14);
}


/* =========================================================
 * Loading
 * ========================================================= */

.viewer-loading {
  position: absolute;

  inset: 0;

  z-index: 5;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  pointer-events: none;
}


/* =========================================================
 * Spinner
 * ========================================================= */

.viewer-spinner {
  width: 18px;

  height: 18px;

  flex-shrink: 0;

  border:
    2px solid
    rgba(255, 255, 255, 0.24);

  border-top-color:
    #fff;

  border-radius: 50%;

  animation:
    spin
    0.8s
    linear
    infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* =========================================================
 * Loading 文字
 * ========================================================= */

.viewer-loading-text {
  margin-top: 10px;

  color:
    rgba(255, 255, 255, 0.68);

  font-size: 12px;

  font-weight: 400;

  line-height: 1.4;

  letter-spacing: 0.03em;

  text-align: center;

  text-shadow:
    0 1px 5px
    rgba(0, 0, 0, 0.4);
}


/* =========================================================
 * 高清图错误
 * ========================================================= */

.viewer-error {
  position: absolute;

  left: 50%;

  bottom: 16px;

  z-index: 6;

  transform:
    translateX(-50%);

  padding:
    7px 12px;

  border-radius: 8px;

  color:
    rgba(255, 255, 255, 0.82);

  background:
    rgba(0, 0, 0, 0.55);

  backdrop-filter:
    blur(8px);

  -webkit-backdrop-filter:
    blur(8px);

  font-size: 12px;

  white-space: nowrap;
}


/* =========================================================
 * 关闭按钮
 * ========================================================= */

.viewer-close {
  position: fixed;

  top: 20px;

  right: 25px;

  z-index: 10;

  width: 44px;

  height: 44px;

  border:
    1px solid
    rgba(255, 255, 255, 0.08);

  border-radius: 50%;

  color: #fff;

  background:
    rgba(255, 255, 255, 0.09);

  backdrop-filter:
    blur(12px);

  -webkit-backdrop-filter:
    blur(12px);

  font-size: 30px;

  line-height: 1;

  cursor: pointer;

  transition:
    background 0.25s ease,
    transform 0.25s ease,
    border-color 0.25s ease;
}

.viewer-close:hover {
  background:
    rgba(255, 255, 255, 0.17);

  border-color:
    rgba(255, 255, 255, 0.15);

  transform:
    rotate(90deg);
}


/* =========================================================
 * 左右切换按钮
 * ========================================================= */

.viewer-nav {
  position: fixed;

  top: 50%;

  z-index: 10;

  width: 52px;

  height: 72px;

  border:
    1px solid
    rgba(255, 255, 255, 0.07);

  border-radius: 16px;

  color: #fff;

  background:
    rgba(255, 255, 255, 0.07);

  backdrop-filter:
    blur(12px);

  -webkit-backdrop-filter:
    blur(12px);

  font-size: 50px;

  font-weight: 200;

  line-height: 1;

  cursor: pointer;

  transform:
    translateY(-50%);

  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease;
}

.viewer-nav:hover {
  background:
    rgba(255, 255, 255, 0.14);

  border-color:
    rgba(255, 255, 255, 0.13);
}

.viewer-nav:active {
  transform:
    translateY(-50%)
    scale(0.94);
}

.viewer-prev {
  left: 24px;
}

.viewer-next {
  right: 24px;
}


/* =========================================================
 * 图片信息
 * ========================================================= */

.viewer-info {
  width: min(900px, 100%);

  margin-top: 18px;

  color: #fff;
}


/* =========================================================
 * 日期 + 序号
 * ========================================================= */

.viewer-meta {
  display: flex;

  align-items: center;

  gap: 10px;
}

.viewer-date {
  color:
    rgba(255, 255, 255, 0.55);

  font-size: 12px;
}

.viewer-counter {
  padding:
    3px 7px;

  border-radius: 6px;

  color:
    rgba(255, 255, 255, 0.48);

  background:
    rgba(255, 255, 255, 0.07);

  font-size: 11px;
}


/* =========================================================
 * 标题
 * ========================================================= */

.viewer-info h2 {
  margin:
    5px 0;

  font-size: 20px;

  font-weight: 650;

  line-height: 1.4;

  letter-spacing: -0.01em;
}


/* =========================================================
 * 描述
 * ========================================================= */

.viewer-info p {
  margin: 0;

  max-width: 850px;

  color:
    rgba(255, 255, 255, 0.68);

  font-size: 13px;

  line-height: 1.6;
}


/* =========================================================
 * 主色调
 * ========================================================= */

.viewer-colors {
  width: 100%;

  margin-top: 18px;
}

.viewer-colors-title {
  margin-bottom: 10px;

  color:
    rgba(255, 255, 255, 0.65);

  font-size: 12px;

  font-weight: 600;
}

.viewer-color-list {
  display: flex;

  flex-wrap: wrap;

  gap: 8px;
}


/* =========================================================
 * 主色调按钮
 * ========================================================= */

.viewer-color {
  display: inline-flex;

  align-items: center;

  gap: 8px;

  min-height: 36px;

  padding:
    7px 10px;

  border:
    1px solid
    rgba(255, 255, 255, 0.12);

  border-radius: 10px;

  color:
    rgba(255, 255, 255, 0.82);

  background:
    rgba(255, 255, 255, 0.07);

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.viewer-color:hover {
  border-color:
    rgba(255, 255, 255, 0.35);

  background:
    rgba(255, 255, 255, 0.14);

  transform:
    translateY(-1px);
}

.viewer-color:active {
  transform:
    translateY(0);
}

.viewer-color.copied {
  border-color:
    rgba(120, 220, 150, 0.7);

  background:
    rgba(120, 220, 150, 0.12);
}


/* =========================================================
 * 颜色预览
 * ========================================================= */

.color-preview {
  width: 20px;

  height: 20px;

  flex-shrink: 0;

  border:
    1px solid
    rgba(255, 255, 255, 0.3);

  border-radius: 6px;
}


/* =========================================================
 * HEX
 * ========================================================= */

.color-name {
  font-family: monospace;

  font-size: 12px;

  font-weight: 600;

  letter-spacing: 0.03em;
}


/* =========================================================
 * 复制提示
 * ========================================================= */

.color-copy {
  color:
    rgba(255, 255, 255, 0.5);

  font-size: 11px;

  transition:
    color 0.2s ease;
}

.viewer-color:hover .color-copy {
  color:
    rgba(255, 255, 255, 0.68);
}

.viewer-color.copied .color-copy {
  color:
    rgba(255, 255, 255, 0.9);
}


/* =========================================================
 * 操作区域
 * ========================================================= */

.viewer-actions {
  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  margin-top: 14px;
}


/* =========================================================
 * 下载 / 打开按钮
 * ========================================================= */

.download-button,
.open-button {
  height: 38px;

  padding:
    0 16px;

  border-radius: 10px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  box-sizing: border-box;

  font-family: inherit;

  font-size: 13px;

  font-weight: 600;

  text-decoration: none;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.download-button:hover,
.open-button:hover {
  transform:
    translateY(-1px);
}

.download-button:active,
.open-button:active {
  transform:
    translateY(0);
}


/* =========================================================
 * 下载
 * ========================================================= */

.download-button {
  border: 0;

  color: #111;

  background: #fff;
}

.download-button:hover {
  background: #f4f4f5;
}

.download-button:disabled {
  cursor: wait;

  opacity: 0.6;
}


/* =========================================================
 * 打开原图
 * ========================================================= */

.open-button {
  color: #fff;

  background:
    rgba(255, 255, 255, 0.08);

  border:
    1px solid
    rgba(255, 255, 255, 0.1);

  backdrop-filter:
    blur(10px);

  -webkit-backdrop-filter:
    blur(10px);
}

.open-button:hover {
  background:
    rgba(255, 255, 255, 0.13);
}


/* =========================================================
 * 查看详情
 * ========================================================= */

.detail-button {
  height: 38px;

  padding:
    0 14px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 6px;

  box-sizing: border-box;

  border:
    1px solid
    rgba(255, 255, 255, 0.18);

  border-radius: 10px;

  color:
    rgba(255, 255, 255, 0.82);

  background:
    rgba(255, 255, 255, 0.04);

  backdrop-filter:
    blur(10px);

  -webkit-backdrop-filter:
    blur(10px);

  font-family: inherit;

  font-size: 13px;

  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.detail-button:hover {
  background:
    rgba(255, 255, 255, 0.10);

  border-color:
    rgba(255, 255, 255, 0.32);

  transform:
    translateY(-1px);
}


/* =========================================================
 * 下载进度
 * ========================================================= */

.download-progress-content {
  display: flex;

  align-items: center;

  gap: 9px;

  width: 100%;
}

.download-progress-track {
  position: relative;

  flex: 1;

  height: 4px;

  overflow: hidden;

  border-radius: 99px;

  background:
    rgba(0, 0, 0, 0.12);
}

.download-progress-bar {
  position: absolute;

  inset:
    0 auto 0 0;

  border-radius: inherit;

  background:
    currentColor;

  transition:
    width 0.15s ease;
}

.download-progress-text {
  min-width: 92px;

  font-size: 10px;

  text-align: right;

  white-space: nowrap;
}


/* =========================================================
 * 颜色分布
 * ========================================================= */

.viewer-histogram {
  width: 100%;

  margin-top: 22px;
}

.viewer-section-title {
  display: flex;

  align-items: baseline;

  gap: 8px;

  margin-bottom: 6px;

  color:
    rgba(255, 255, 255, 0.78);

  font-size: 12px;

  font-weight: 600;
}

.viewer-section-meta {
  color:
    rgba(255, 255, 255, 0.38);

  font-size: 10px;

  font-weight: 400;
}

.histogram-description {
  margin-bottom: 12px;

  color:
    rgba(255, 255, 255, 0.42);

  font-size: 11px;

  line-height: 1.5;
}


/* =========================================================
 * Histogram wrapper
 * ========================================================= */

.histogram-wrapper {
  width: 100%;

  padding: 12px;

  box-sizing: border-box;

  border:
    1px solid
    rgba(255, 255, 255, 0.08);

  border-radius: 14px;

  background:
    rgba(255, 255, 255, 0.045);

  backdrop-filter:
    blur(12px);

  -webkit-backdrop-filter:
    blur(12px);
}


/* =========================================================
 * Hue 横轴
 * ========================================================= */

.histogram-hue-axis {
  display: grid;

  grid-template-columns:
    repeat(12, minmax(0, 1fr));

  gap: 4px;

  margin-left: 92px;

  margin-bottom: 6px;
}

.histogram-hue-label {
  min-width: 0;

  color:
    rgba(255, 255, 255, 0.38);

  font-size: 9px;

  text-align: center;

  white-space: nowrap;
}


/* =========================================================
 * Histogram 主体
 * ========================================================= */

.histogram-main {
  display: grid;

  grid-template-columns:
    84px minmax(0, 1fr);

  gap: 8px;
}


/* =========================================================
 * 左侧标签
 * ========================================================= */

.histogram-row-labels {
  display: grid;

  grid-template-rows:
    repeat(9, minmax(0, 1fr));

  gap: 4px;
}

.histogram-row-label {
  display: flex;

  align-items: center;

  justify-content: flex-end;

  padding-right: 4px;

  color:
    rgba(255, 255, 255, 0.38);

  font-size: 9px;

  line-height: 1.2;

  text-align: right;

  white-space: nowrap;
}


/* =========================================================
 * 108 个颜色格
 * ========================================================= */

.histogram-grid {
  display: grid;

  grid-template-columns:
    repeat(12, minmax(0, 1fr));

  grid-template-rows:
    repeat(9, minmax(24px, 1fr));

  gap: 4px;
}

.histogram-cell {
  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 24px;

  padding: 0;

  border:
    1px solid
    rgba(255, 255, 255, 0.08);

  border-radius: 5px;

  cursor: crosshair;

  box-sizing: border-box;

  transition:
    transform 0.16s ease,
    opacity 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.histogram-cell:hover,
.histogram-cell.active {
  opacity: 1 !important;

  transform:
    scale(1.08);

  border-color:
    rgba(255, 255, 255, 0.8);

  box-shadow:
    0 0 0 2px
      rgba(255, 255, 255, 0.12),
    0 5px 16px
      rgba(0, 0, 0, 0.28);

  position: relative;

  z-index: 2;
}

.histogram-cell:focus-visible {
  outline:
    2px solid
    rgba(255, 255, 255, 0.9);

  outline-offset: 2px;
}


/* =========================================================
 * Histogram hover 信息
 * ========================================================= */

.histogram-hover-info {
  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 8px;

  min-height: 36px;

  margin-top: 9px;

  padding:
    8px 10px;

  box-sizing: border-box;

  border-radius: 9px;

  background:
    rgba(255, 255, 255, 0.055);

  color:
    rgba(255, 255, 255, 0.68);

  font-size: 10px;
}

.histogram-hover-color {
  width: 12px;

  height: 12px;

  flex-shrink: 0;

  border-radius: 4px;

  border:
    1px solid
    rgba(255, 255, 255, 0.35);
}

.histogram-hover-main {
  color:
    rgba(255, 255, 255, 0.9);

  font-weight: 600;
}

.histogram-hover-range {
  color:
    rgba(255, 255, 255, 0.45);
}

.histogram-hover-info strong {
  margin-left: auto;

  color:
    rgba(255, 255, 255, 0.9);

  font-size: 11px;
}

.histogram-hover-placeholder {
  color:
    rgba(255, 255, 255, 0.35);
}


/* =========================================================
 * 移动端
 * ========================================================= */

@media (max-width: 700px) {

  /* 滚动区域 */
  .viewer-scroll {
    padding:
      20px 16px 40px;
  }

  /* 显示器 */
  .viewer-monitor {
    margin-bottom: 24px;
  }

  .viewer-monitor-bezel {
    padding:
      7px 7px 12px;

    border-radius: 11px;
  }

  /* 屏幕 */
  .viewer-image-wrapper {
    border-radius: 6px;
  }

  .viewer-image {
    border-radius: 4px;
  }

  /* 摄像头 */
  .viewer-monitor-camera {
    top: 1px;

    width: 24px;

    height: 6px;
  }

  .viewer-monitor-camera::before {
    width: 3px;

    height: 3px;
  }

  .viewer-monitor-camera::after {
    right: 5px;
  }

 

  /* 支架 */
  .viewer-monitor-stand {
    width: 120px;

    height: 26px;
  }

  .viewer-monitor-neck {
    width: 25px;

    height: 18px;
  }

  .viewer-monitor-base {
    width: 105px;

    height: 6px;
  }

  /* 左右按钮 */
  .viewer-nav {
    width: 40px;

    height: 52px;

    border-radius: 13px;

    font-size: 38px;
  }

  .viewer-prev {
    left: 8px;
  }

  .viewer-next {
    right: 8px;
  }

  /* 关闭 */
  .viewer-close {
    top: 10px;

    right: 10px;

    width: 40px;

    height: 40px;

    font-size: 27px;
  }

  /* 信息 */
  .viewer-info {
    margin-top: 12px;
  }

  .viewer-info h2 {
    font-size: 18px;
  }

  .viewer-info p {
    font-size: 12px;

    display: -webkit-box;

    -webkit-line-clamp: 2;

    -webkit-box-orient: vertical;

    overflow: hidden;
  }

  /* 主色调 */
  .viewer-colors {
    margin-top: 14px;
  }

  .viewer-color {
    min-height: 34px;

    padding:
      6px 9px;
  }

  /* 操作 */
  .viewer-actions {
    margin-top: 10px;

    gap: 8px;
  }

  .download-button,
  .open-button,
  .detail-button {
    height: 36px;

    padding:
      0 12px;

    font-size: 12px;
  }

  /* Loading */
  .viewer-loading-text {
    margin-top: 8px;

    font-size: 11px;
  }

  .viewer-spinner {
    width: 16px;

    height: 16px;
  }

  /* 直方图 */
  .histogram-wrapper {
    padding: 8px;
  }

  .histogram-hue-axis {
    margin-left: 70px;

    gap: 2px;
  }

  .histogram-main {
    grid-template-columns:
      64px minmax(0, 1fr);

    gap: 6px;
  }

  .histogram-row-label {
    font-size: 8px;
  }

  .histogram-grid {
    gap: 3px;

    grid-template-rows:
      repeat(9, minmax(20px, 1fr));
  }

  .histogram-cell {
    min-height: 20px;

    border-radius: 4px;
  }

  .histogram-hover-info {
    min-height: 34px;

    padding:
      7px 8px;

    gap: 6px;
  }

  .histogram-hover-main {
    font-size: 9px;
  }

  .histogram-hover-range {
    font-size: 9px;
  }
}

</style>