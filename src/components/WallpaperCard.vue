<template>
  <article
    :id="`wallpaper-${item.date}`"
    class="wallpaper-card"
    :style="cardStyle"
    tabindex="0"
    role="button"
    :aria-label="`查看壁纸：${item.title || item.date}`"
    :aria-busy="loadState === 'loading'"
    @click="handleClick"
    @keydown.enter.prevent="handleKeyboardClick"
    @keydown.space.prevent="handleKeyboardClick"
  >
    <div class="card-image">
      <!-- Base64 模糊占位 -->
      <div
        class="card-placeholder"
        :class="{ loaded: imageLoaded }"
      />

      <!-- 真实图片 -->
      <img
        v-if="shouldLoad"
        :key="`${item.date}-${retryKey}`"
        class="wallpaper-image"
        :class="{ loaded: imageLoaded }"
        :src="item.preview || item.image"
        :alt="item.title || item.copyright || item.date"
        loading="eager"
        decoding="async"
        @load="handleLoaded"
        @error="handleError"
      />

      <!-- 尚未进入加载队列 -->
      <div
        v-if="loadState === 'idle'"
        class="image-loading image-waiting"
        aria-label="等待加载"
      >
        <span class="waiting-dots">
          <i />
          <i />
          <i />
        </span>

        <span class="loading-label">
          等待加载
        </span>
      </div>

      <!-- 正在加载 -->
      <div
        v-else-if="loadState === 'loading'"
        class="image-loading"
        aria-label="正在加载"
      >
        <span class="loading-spinner" />

        <span class="loading-label">
          正在加载
        </span>
      </div>

      <!-- 加载失败 -->
      <div
        v-else-if="loadState === 'error'"
        class="image-error-state"
      >
        <span class="error-label">
          图片加载失败
        </span>

        <button
          class="retry-button"
          type="button"
          aria-label="重新加载图片"
          title="重新加载"
          @click.stop="handleRetry"
        >
          ↻
        </button>
      </div>

      <!-- 图片遮罩 -->
      <div class="image-mask" />

      <!-- 顶部信息 -->
      <div class="card-top">
        <span class="date-badge">
          {{ formatDate(item.date) }}
        </span>

        <span
          v-if="accentColor"
          class="color-dot"
          :title="`主色调 ${accentColor}`"
        />
      </div>

      <!-- 底部信息 -->
      <div class="card-content">
        <div class="card-title">
          {{ item.title || 'Bing Wallpaper' }}
        </div>
        <div
          v-if="colorFingerprint.length"
          class="color-fingerprint"
          aria-label="图片色彩指纹"
        >
          <button
            v-for="(cell, index) in colorFingerprint"
            :key="index"
            type="button"
            class="color-fingerprint-cell"
            :class="{
              active: hoveredFingerprintIndex === index
            }"
            :style="{
              '--fingerprint-color': cell.color,
              '--fingerprint-opacity': cell.opacity
            }"
            :aria-label="cell.description"
            @mouseenter="hoveredFingerprintIndex = index"
            @mouseleave="hoveredFingerprintIndex = -1"
            @focus="hoveredFingerprintIndex = index"
            @blur="hoveredFingerprintIndex = -1"
            @click.stop
          />
        </div>

        <div
          v-if="hoveredFingerprintCell"
          class="color-fingerprint-info"
        >
          <span
            class="color-fingerprint-info-color"
            :style="{
              backgroundColor: hoveredFingerprintCell.color
            }"
          />

          <span class="color-fingerprint-info-main">
            {{ hoveredFingerprintCell.hueName }}
            ·
            {{ hoveredFingerprintCell.hueRange }}
          </span>

          <span class="color-fingerprint-info-total">
            {{ hoveredFingerprintCell.percentage }}%
          </span>

          <span class="color-fingerprint-info-detail">
            低 {{ hoveredFingerprintCell.saturationPercentages[0] }}%
            ·
            中 {{ hoveredFingerprintCell.saturationPercentages[1] }}%
            ·
            高 {{ hoveredFingerprintCell.saturationPercentages[2] }}%
          </span>
        </div>
        <div class="card-description">
          {{ item.description || item.copyright || '' }}
        </div>

        <div class="card-action">
          <span>查看高清</span>

          <span class="arrow">
            ↗
          </span>
        </div>
      </div>

      <!-- 屏幕阅读器状态 -->
      <span class="sr-only" aria-live="polite">
        {{ statusText }}
      </span>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },

  shouldLoad: {
    type: Boolean,
    default: false
  },

  loadState: {
    type: String,
    default: 'idle'
  },

  retryKey: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'click',
  'image-loaded',
  'image-error',
  'retry-image'
])

const imageLoaded = ref(false)

const HUE_DEFINITIONS = [
  {
    name: '红',
    range: '0°–30°',
    degrees: 0
  },
  {
    name: '橙',
    range: '30°–60°',
    degrees: 30
  },
  {
    name: '黄',
    range: '60°–90°',
    degrees: 60
  },
  {
    name: '黄绿',
    range: '90°–120°',
    degrees: 90
  },
  {
    name: '绿',
    range: '120°–150°',
    degrees: 120
  },
  {
    name: '青绿',
    range: '150°–180°',
    degrees: 150
  },
  {
    name: '青',
    range: '180°–210°',
    degrees: 180
  },
  {
    name: '蓝',
    range: '210°–240°',
    degrees: 210
  },
  {
    name: '蓝紫',
    range: '240°–270°',
    degrees: 240
  },
  {
    name: '紫',
    range: '270°–300°',
    degrees: 270
  },
  {
    name: '品红',
    range: '300°–330°',
    degrees: 300
  },
  {
    name: '玫红',
    range: '330°–360°',
    degrees: 330
  }
]

const SATURATION_NAMES = [
  '低饱和度',
  '中饱和度',
  '高饱和度'
]

const SATURATION_VALUES = [
  25,
  60,
  90
]

const VALUE_VALUES = [
  35,
  65,
  92
]

const colorFingerprint = computed(() => {
  const histogram = props.item?.colorHistogram

  if (
    !histogram ||
    histogram.version !== 1 ||
    !Array.isArray(histogram.bins) ||
    histogram.bins.length !== 108
  ) {
    return []
  }

  const bins = histogram.bins.map(
    value => Number(value) || 0
  )

  const total = bins.reduce(
    (sum, value) => sum + value,
    0
  )

  if (total <= 0) {
    return []
  }

  const cells = []

  /*
   * 首页只展示 12 个 Hue。
   *
   * 每个 Hue：
   * 12 × 3 × 3
   *      ↓
   * 1 个色块
   *
   * 也就是说：
   *
   * 108 个原始 bin
   *        ↓
   * 12 个首页色块
   */
  for (let hue = 0; hue < 12; hue += 1) {
    let totalWeight = 0

    const saturationWeights = [
      0,
      0,
      0
    ]

    let saturationWeightedSum = 0
    let valueWeightedSum = 0

    for (let saturation = 0; saturation < 3; saturation += 1) {
      for (let value = 0; value < 3; value += 1) {
        const index =
          hue * 9 +
          saturation * 3 +
          value

        const weight = bins[index]

        totalWeight += weight

        saturationWeights[saturation] += weight

        saturationWeightedSum +=
          weight * SATURATION_VALUES[saturation]

        valueWeightedSum +=
          weight * VALUE_VALUES[value]
      }
    }

    const percentage =
      totalWeight / total * 100

    const averageSaturation =
      totalWeight > 0
        ? saturationWeightedSum / totalWeight
        : 60

    const averageValue =
      totalWeight > 0
        ? valueWeightedSum / totalWeight
        : 65

    const hueInfo =
      HUE_DEFINITIONS[hue]

    const saturationPercentages =
      saturationWeights.map(weight => {
        return (
          weight / total * 100
        ).toFixed(1)
      })

    cells.push({
      color: `hsl(
        ${hueInfo.degrees}
        ${Math.round(averageSaturation)}%
        ${Math.round(averageValue)}%
      )`,

      weight: totalWeight,

      percentage:
        percentage.toFixed(1),

      opacity:
        totalWeight > 0
          ? 0.28 + (
              percentage / 100
            ) * 0.72
          : 0.08,

      hueName: hueInfo.name,

      hueRange: hueInfo.range,

      saturationPercentages,

      description:
        `${hueInfo.name} · ` +
        `${hueInfo.range} · ` +
        `占整张图片 ${percentage.toFixed(1)}%`
    })
  }

  return cells
})

const hoveredFingerprintIndex = ref(-1)

const hoveredFingerprintCell = computed(() => {
  if (hoveredFingerprintIndex.value < 0) {
    return null
  }

  return (
    colorFingerprint.value[
      hoveredFingerprintIndex.value
    ] || null
  )
})

const accentColor = computed(() => {
  const color = props.item?.color || {}

  return (
    color.Vibrant ||
    color.LightVibrant ||
    color.Muted ||
    color.DarkVibrant ||
    color.LightMuted ||
    color.DarkMuted ||
    ''
  )
})

const cardStyle = computed(() => {
  const style = {}
  const base64 = props.item?.base64

  if (base64) {
    style['--placeholder-image'] = `url("${base64}")`
  }

  if (accentColor.value) {
    style['--accent-color'] = accentColor.value
  }

  return style
})

const statusText = computed(() => {
  const statusMap = {
    idle: '图片等待加载',
    loading: '图片正在加载',
    loaded: '图片加载完成',
    error: '图片加载失败'
  }

  return statusMap[props.loadState] || ''
})

function handleClick() {
  emit('click', props.item)
}

function handleKeyboardClick() {
  emit('click', props.item)
}

function handleLoaded() {
  imageLoaded.value = true

  emit('image-loaded', props.item.date)
}

function handleError() {
  imageLoaded.value = false

  emit('image-error', props.item.date)
}

function handleRetry() {
  imageLoaded.value = false

  emit('retry-image', props.item.date)
}

function formatDate(date) {
  if (!date) {
    return ''
  }

  const parts = date.split('-')

  if (parts.length !== 3) {
    return date
  }

  return `${parts[0]}.${parts[1]}.${parts[2]}`
}

// 重新加载时先恢复占位图状态
watch(
  () => props.retryKey,
  () => {
    imageLoaded.value = false
  }
)
</script>

<style scoped>
.wallpaper-card {
  scroll-margin-top: 110px;

  --accent-color: #ffffff;

  position: relative;

  min-width: 0;

  /*
   * Bing 原图本身就是 16:9，
   * 让图片主体尽可能完整地展示。
   */
  aspect-ratio: 16 / 9;

  cursor: pointer;

  border-radius: 17px;

  overflow: hidden;

  background: #111;

  transform: translateY(0);

  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08);

  transition:
    transform 0.45s cubic-bezier(.2, .8, .2, 1),
    box-shadow 0.45s ease;
}


/* 主色调只做很轻的视觉强调 */

.wallpaper-card::after {
  content: "";

  position: absolute;

  left: 12%;
  right: 12%;
  bottom: -30px;

  height: 60px;

  background: var(--accent-color);

  opacity: 0;

  filter: blur(28px);

  pointer-events: none;

  transition: opacity 0.45s ease;
}

.wallpaper-card:hover {
  transform: translateY(-6px);

  box-shadow:
    0 22px 48px rgba(0, 0, 0, 0.18),
    0 0 0 1px color-mix(
      in srgb,
      var(--accent-color) 35%,
      transparent
    );
}

.wallpaper-card:hover::after {
  opacity: 0.22;
}


/* ================================
   Image
================================ */

.card-image {
  position: relative;

  width: 100%;
  height: 100%;

  overflow: hidden;
}


/* Base64 模糊占位 */

.card-placeholder {
  position: absolute;

  inset: 0;

  background-image: var(--placeholder-image);

  background-size: cover;

  background-position: center;

  filter: blur(18px);

  transform: scale(1.12);

  opacity: 1;

  transition:
    opacity 0.6s ease;
}

.card-placeholder.loaded {
  opacity: 0;
}


/* Wallpaper */

.wallpaper-image {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;

  opacity: 0;

  transform: scale(1.01);

  transition:
    opacity 0.6s ease,
    transform 0.8s cubic-bezier(.2, .8, .2, 1),
    filter 0.5s ease;
}

.wallpaper-image.loaded {
  opacity: 1;
}


/*
 * Hover 时轻微放大，
 * 不要过度裁剪图片主体。
 */

.wallpaper-card:hover .wallpaper-image {
  transform: scale(1.045);

  filter: brightness(1.045);
}


/* ================================
   Image Mask
================================ */

.image-mask {
  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.02) 0%,
      rgba(0, 0, 0, 0.01) 38%,
      rgba(0, 0, 0, 0.78) 100%
    );

  opacity: 0.72;

  transition:
    opacity 0.45s ease;
}

.wallpaper-card:hover .image-mask {
  opacity: 0.9;
}


/* ================================
   Top
================================ */

.card-top {
  position: absolute;

  top: 14px;
  left: 14px;
  right: 14px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  z-index: 3;
}

.date-badge {
  padding: 6px 10px;

  border-radius: 9px;

  color: #fff;

  background: rgba(0, 0, 0, 0.28);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  font-size: 11px;
  font-weight: 600;

  letter-spacing: 0.25px;

  border: 1px solid rgba(255, 255, 255, 0.15);

  transition:
    background 0.3s ease,
    border-color 0.3s ease,
    transform 0.3s ease;
}

.wallpaper-card:hover .date-badge {
  background: color-mix(
    in srgb,
    var(--accent-color) 28%,
    rgba(0, 0, 0, 0.35)
  );

  border-color: color-mix(
    in srgb,
    var(--accent-color) 50%,
    rgba(255, 255, 255, 0.15)
  );

  transform: translateY(-2px);
}


/* 图片主色的小圆点 */

.color-dot {
  width: 9px;
  height: 9px;

  border-radius: 50%;

  background: var(--accent-color);

  border: 1px solid rgba(255, 255, 255, 0.7);

  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.08),
    0 0 14px color-mix(
      in srgb,
      var(--accent-color) 70%,
      transparent
    );

  opacity: 0;

  transform: scale(0.7);

  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.wallpaper-card:hover .color-dot {
  opacity: 1;

  transform: scale(1);
}


/* ================================
   Content
================================ */

.card-content {
  position: absolute;

  left: 17px;
  right: 17px;
  bottom: 16px;

  z-index: 3;

  color: #fff;
}

.card-title {
  font-size: 17px;
  font-weight: 650;

  line-height: 1.35;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.35);
}

.card-description {
  margin-top: 5px;

  font-size: 11px;

  line-height: 1.5;

  color: rgba(255, 255, 255, 0.78);

  display: -webkit-box;

  -webkit-line-clamp: 1;

  -webkit-box-orient: vertical;

  overflow: hidden;

  opacity: 0.9;
}


/* ================================
   Action
================================ */

.card-action {
  display: flex;

  align-items: center;

  gap: 6px;

  margin-top: 11px;

  font-size: 11px;

  font-weight: 600;

  color: color-mix(
    in srgb,
    var(--accent-color) 75%,
    #fff
  );

  opacity: 0;

  transform: translateY(7px);

  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.wallpaper-card:hover .card-action {
  opacity: 1;

  transform: translateY(0);
}

.arrow {
  font-size: 15px;

  line-height: 1;

  transition:
    transform 0.3s ease;
}

.wallpaper-card:hover .arrow {
  transform:
    translate(2px, -2px);
}


/* ================================
   Loading
================================ */

.image-loading {
  position: absolute;

  inset: 0;

  display: flex;

  align-items: center;
  justify-content: center;

  z-index: 2;
}

.loading-spinner {
  width: 22px;
  height: 22px;

  border: 2px solid rgba(255, 255, 255, 0.25);

  border-top-color: rgba(255, 255, 255, 0.95);

  border-radius: 50%;

  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* ================================
   Mobile
================================ */

@media (max-width: 700px) {
  .wallpaper-card {
    border-radius: 14px;

    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.08);
  }

  .card-title {
    font-size: 15px;
  }

  .card-description {
    font-size: 11px;
  }

  .card-action {
    opacity: 1;

    transform: none;
  }

  .wallpaper-card:hover {
    transform: none;

    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.08);
  }

  .wallpaper-card:hover::after {
    opacity: 0;
  }

  .wallpaper-card:hover .wallpaper-image {
    transform: scale(1.01);
  }

  .color-dot {
    display: none;
  }
}
/* 键盘聚焦 */
.wallpaper-card:focus-visible {
  outline: 3px solid var(--accent-color);
  outline-offset: 4px;
}

/* 加载文字 */
.loading-label,
.error-label {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.35);
}

/* 等待加载状态 */
.image-waiting {
  gap: 2px;
}

.waiting-dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.waiting-dots i {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: waiting-pulse 1.4s ease-in-out infinite;
}

.waiting-dots i:nth-child(2) {
  animation-delay: 0.2s;
}

.waiting-dots i:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes waiting-pulse {
  0%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

/* 加载失败 */
.image-error-state {
  position: absolute;
  inset: 0;
  z-index: 3;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  background: rgba(8, 10, 14, 0.2);
}

.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 34px;
  height: 34px;
  margin-top: 10px;

  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;

  color: #fff;
  background: rgba(20, 24, 32, 0.8);

  font-size: 20px;
  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.retry-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(-30deg) scale(1.08);
}

.retry-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

/* 隐藏但可被屏幕阅读器识别 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
/* ================================
   Color Fingerprint
================================ */

.color-fingerprint {
  position: relative;

  display: flex;

  width: 100%;
  height: 9px;

  margin-top: 10px;

  overflow: visible;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.08);

  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 3px 12px rgba(0, 0, 0, 0.12);

  isolation: isolate;

  transition:
    height 0.22s ease;
}

.color-fingerprint-cell {
  position: relative;

  flex: 1 1 0;

  width: 0;
  height: 100%;

  min-width: 0;
  min-height: 0;

  padding: 0;

  border: 0;

  background:
    var(--fingerprint-color);

  opacity:
    var(--fingerprint-opacity);

  cursor: crosshair;

  transition:
    transform 0.18s cubic-bezier(.2, .8, .2, 1),
    opacity 0.18s ease,
    filter 0.18s ease,
    box-shadow 0.18s ease;

  z-index: 1;
}

/*
 * 让整条色彩带保持连续，
 * 只有最外侧两个色块拥有圆角。
 */
.color-fingerprint-cell:first-child {
  border-radius: 999px 0 0 999px;
}

.color-fingerprint-cell:last-child {
  border-radius: 0 999px 999px 0;
}

/*
 * Hover 时：
 *
 * - 色块变高
 * - 稍微放大
 * - 提升亮度
 * - 覆盖相邻色块
 *
 * 但不改变它原本的位置。
 */
.color-fingerprint-cell:hover,
.color-fingerprint-cell.active {
  opacity: 1;

  transform:
    scaleY(2.5)
    scaleX(1.12);

  filter:
    saturate(1.12)
    brightness(1.08);

  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 5px 14px rgba(0, 0, 0, 0.35);

  z-index: 10;
}



/*
 * 键盘聚焦
 */
.color-fingerprint-cell:focus-visible {
  outline:
    2px solid
    rgba(255, 255, 255, 0.95);

  outline-offset: 3px;

  opacity: 1;

  transform:
    scaleY(2.5)
    scaleX(1.12);

  z-index: 10;
}

/* ================================
   Fingerprint Detail
================================ */
.color-fingerprint-info {
  position: absolute;

  left: 50%;

  bottom: calc(100% + 12px);

  transform: translateX(-50%);

  z-index: 30;

  display: flex;

  align-items: center;

  gap: 7px;

  width: max-content;

  max-width: min(
    280px,
    calc(100vw - 32px)
  );

  min-height: 26px;

  padding: 6px 9px;

  box-sizing: border-box;

  border:
    1px solid
    rgba(255, 255, 255, 0.12);

  border-radius: 8px;

  background:
    rgba(15, 15, 18, 0.88);

  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.28),
    0 1px 2px rgba(0, 0, 0, 0.18);

  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  color:
    rgba(255, 255, 255, 0.7);

  font-size: 9px;

  line-height: 1.3;

  white-space: nowrap;

  pointer-events: none;

  opacity: 0;

  animation:
    color-fingerprint-info-in
    0.16s ease forwards;
}

.color-fingerprint-info::after {
  content: '';

  position: absolute;

  left: 50%;

  top: 100%;

  width: 7px;
  height: 7px;

  transform:
    translate(-50%, -4px)
    rotate(45deg);

  border-right:
    1px solid
    rgba(255, 255, 255, 0.12);

  border-bottom:
    1px solid
    rgba(255, 255, 255, 0.12);

  background:
    rgba(15, 15, 18, 0.88);
}

@keyframes color-fingerprint-info-in {
  from {
    opacity: 0;

    transform:
      translateX(-50%)
      translateY(3px);
  }

  to {
    opacity: 1;

    transform:
      translateX(-50%)
      translateY(0);
  }
}

.color-fingerprint-info-color {
  width: 10px;
  height: 10px;

  flex-shrink: 0;

  border-radius: 50%;

  border:
    1px solid
    rgba(255, 255, 255, 0.65);

  box-shadow:
    0 0 7px rgba(255, 255, 255, 0.16);
}

.color-fingerprint-info-main {
  color:
    rgba(255, 255, 255, 0.92);

  font-weight: 600;
}

.color-fingerprint-info-total {
  color:
    rgba(255, 255, 255, 0.88);

  font-weight: 600;
}

.color-fingerprint-info-detail {
  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;

  color:
    rgba(255, 255, 255, 0.48);
}

@media (max-width: 700px) {
  .color-fingerprint {
    height: 7px;

    margin-top: 8px;
  }

  .wallpaper-card:hover .color-fingerprint {
    height: 8px;
  }

  .color-fingerprint-info {
    margin-top: 5px;

    font-size: 8px;
  }

  .color-fingerprint-cell:hover,
  .color-fingerprint-cell.active {
    transform:
      scaleY(2.2)
      scaleX(1.08);
  }
}
</style>