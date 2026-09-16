
<template>
  <Teleport to="body">
    <div
      class="viewer"
      :style="viewerStyle"
      @click.self="close"
    >
      <!-- 主色调背景 -->
      <div
        class="viewer-color-bg"
        :style="colorBackgroundStyle"
      />

      <!-- 深色遮罩 -->
      <div class="viewer-overlay" />

      <!-- 关闭 -->
      <button
        class="viewer-close"
        aria-label="关闭"
        @click="close"
      >
        ×
      </button>

      <!-- 上一张 -->
      <button
        v-if="hasPrevious"
        class="viewer-nav viewer-prev"
        aria-label="上一张"
        @click="previous"
      >
        ‹
      </button>

      <!-- 下一张 -->
      <button
        v-if="hasNext"
        class="viewer-nav viewer-next"
        aria-label="下一张"
        @click="next"
      >
        ›
      </button>

      <div class="viewer-content">
        <!-- 图片 -->
        <div class="viewer-image-wrapper">
          <img
            v-if="displayImage"
            :key="displayImage"
            :src="displayImage"
            :alt="item?.title || item?.date"
            class="viewer-image"
            :class="{
              'is-placeholder': !highResLoaded,
              'is-high-res': highResLoaded
            }"
            @error="handleDisplayError"
          >

          <!-- 高清图加载动画 -->
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

        <!-- 图片信息 -->
        <div class="viewer-info">
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

          <h2>
            {{ item?.title || 'Bing Wallpaper' }}
          </h2>

          <p>
            {{ item?.description || item?.copyright || '' }}
          </p>

          <!-- 主色调 -->
          <button
            v-if="primaryColor"
            class="viewer-color"
            :class="{ copied: copied }"
            :title="copied ? '已复制' : '点击复制颜色值'"
            @click="copyColor"
          >
            <span
              class="color-preview"
              :style="{ backgroundColor: primaryColor }"
            />

            <span class="color-name">
              {{ primaryColor.toUpperCase() }}
            </span>

            <span class="color-copy">
              {{ copied ? '✓ 已复制' : '复制' }}
            </span>
          </button>

          <!-- 操作 -->
          <div class="viewer-actions">
            <button
              class="download-button"
              :disabled="downloading"
              @click="downloadImage"
            >
              <span v-if="downloading">
                下载中...
              </span>

              <span v-else>
                下载原图
              </span>
            </button>

            <a
              v-if="item?.image"
              class="open-button"
              :href="item.image"
              target="_blank"
              rel="noopener noreferrer"
            >
              打开原图
            </a>
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

const props = defineProps({
  item: {
    type: Object,
    default: null
  },

  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'close',
  'change'
])

/*
 * 当前真正显示的图片
 *
 * 切换时先设置成 Base64，
 * 高清图加载完成后再切换成高清图。
 */
const displayImage = ref('')

/*
 * 高清图是否加载完成
 */
const highResLoaded = ref(false)

/*
 * 高清图加载状态
 */
const imageLoading = ref(false)

/*
 * 高清图加载失败
 */
const imageError = ref(false)

/*
 * 下载状态
 */
const downloading = ref(false)

/*
 * 复制状态
 */
const copied = ref(false)

/*
 * 当前图片索引
 */
const currentIndex = computed(() => {
  if (!props.item) {
    return -1
  }

  return props.items.findIndex(
    item => item.date === props.item.date
  )
})

const hasPrevious = computed(() => {
  return currentIndex.value > 0
})

const hasNext = computed(() => {
  return (
    currentIndex.value >= 0 &&
    currentIndex.value < props.items.length - 1
  )
})

/*
 * Base64
 */
const placeholderImage = computed(() => {
  return props.item?.base64 || ''
})

/*
 * 主色调
 */
const primaryColor = computed(() => {
  const color = props.item?.color

  if (!color) {
    return ''
  }

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

/*
 * Viewer CSS 变量
 */
const viewerStyle = computed(() => {
  return {
    '--viewer-color': primaryColor.value || '#667085'
  }
})

/*
 * 主色调背景
 *
 * 只使用很低的透明度。
 */
const colorBackgroundStyle = computed(() => {
  if (!primaryColor.value) {
    return {
      opacity: '0'
    }
  }

  return {
    background: `
      radial-gradient(
        circle at 50% 40%,
        ${primaryColor.value} 0%,
        transparent 65%
      )
    `,
    opacity: '0.16'
  }
})

/*
 * 当前正在预加载的 Image 对象
 *
 * 切换图片的时候，如果上一张还没有加载完，
 * 可以取消它的事件引用。
 */
let preloadImage = null

/*
 * 初始化 / 切换图片
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
 * 加载当前图片
 *
 * 核心逻辑：
 *
 * Base64
 *   ↓
 * 立即显示
 *   ↓
 * 后台加载高清图
 *   ↓
 * 高清图 onload
 *   ↓
 * displayImage = 高清图
 */
function loadCurrentImage() {
  /*
   * 清理上一张图片的预加载对象
   */
  if (preloadImage) {
    preloadImage.onload = null
    preloadImage.onerror = null
    preloadImage = null
  }

  copied.value = false

  highResLoaded.value = false

  imageError.value = false

  /*
   * 第一时间显示 Base64
   */
  displayImage.value = placeholderImage.value

  /*
   * 没有高清图就不继续加载
   */
  if (!props.item?.image) {
    imageLoading.value = false
    return
  }

  /*
   * 有高清图，开始后台加载
   */
  imageLoading.value = true

  const image = new Image()

  preloadImage = image

  /*
   * 防止浏览器缓存导致部分情况下无法正常处理
   *
   * 不在 URL 后面强行加时间戳，
   * 避免破坏 GitHub Raw 的缓存。
   */
  image.onload = () => {
    /*
     * 确认当前还是这一张图片
     */
    if (
      props.item?.image !== image.src
    ) {
      return
    }

    /*
     * 高清图已经完整加载成功
     *
     * 现在才替换真正显示的图片。
     */
    displayImage.value = props.item.image

    highResLoaded.value = true

    imageLoading.value = false

    imageError.value = false
  }

  image.onerror = () => {
    /*
     * 高清图加载失败
     *
     * 不影响 Base64。
     */
    imageLoading.value = false

    highResLoaded.value = false

    imageError.value = true
  }

  /*
   * 开始加载高清图
   */
  image.src = props.item.image
}

/*
 * 展示图片本身加载失败
 */
function handleDisplayError() {
  /*
   * 如果已经是高清图，
   * 出现错误时退回 Base64。
   */
  if (
    highResLoaded.value &&
    placeholderImage.value
  ) {
    displayImage.value = placeholderImage.value

    highResLoaded.value = false

    imageLoading.value = false

    imageError.value = true
  }
}

/*
 * 关闭
 */
function close() {
  emit('close')
}

/*
 * 上一张
 */
function previous() {
  if (!hasPrevious.value) {
    return
  }

  emit(
    'change',
    props.items[currentIndex.value - 1]
  )
}

/*
 * 下一张
 */
function next() {
  if (!hasNext.value) {
    return
  }

  emit(
    'change',
    props.items[currentIndex.value + 1]
  )
}

/*
 * 键盘控制
 */
function handleKeydown(event) {
  if (event.key === 'Escape') {
    close()
    return
  }

  if (event.key === 'ArrowLeft') {
    previous()
    return
  }

  if (event.key === 'ArrowRight') {
    next()
  }
}

/*
 * 复制颜色
 */
async function copyColor() {
  if (!primaryColor.value) {
    return
  }

  const color = primaryColor.value.toUpperCase()

  try {
    await navigator.clipboard.writeText(color)

    copied.value = true

    setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch (error) {
    /*
     * 兼容非 HTTPS / 部分旧浏览器
     */
    try {
      const textarea = document.createElement('textarea')

      textarea.value = color

      textarea.style.position = 'fixed'

      textarea.style.left = '-9999px'

      textarea.style.top = '0'

      document.body.appendChild(textarea)

      textarea.focus()

      textarea.select()

      document.execCommand('copy')

      textarea.remove()

      copied.value = true

      setTimeout(() => {
        copied.value = false
      }, 1800)
    } catch (copyError) {
      console.error(
        '复制颜色失败:',
        copyError
      )
    }
  }
}

/*
 * 下载原图
 */
async function downloadImage() {
  if (
    !props.item?.image ||
    downloading.value
  ) {
    return
  }

  downloading.value = true

  try {
    const response = await fetch(
      props.item.image
    )

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      )
    }

    const blob = await response.blob()

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    link.download = `${
      props.item.date || 'bing-wallpaper'
    }.jpg`

    document.body.appendChild(link)

    link.click()

    link.remove()

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  } catch (error) {
    console.error(
      '下载失败:',
      error
    )

    /*
     * 如果 fetch 下载失败，
     * 直接打开原图。
     */
    window.open(
      props.item.image,
      '_blank',
      'noopener,noreferrer'
    )
  } finally {
    downloading.value = false
  }
}

/*
 * 生命周期
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

  if (preloadImage) {
    preloadImage.onload = null
    preloadImage.onerror = null
    preloadImage = null
  }
})
</script>

<style scoped>
.viewer {
  position: fixed;

  inset: 0;

  z-index: 9999;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 40px;

  background:
    linear-gradient(
      180deg,
      rgba(8, 10, 14, 0.94),
      rgba(8, 10, 14, 0.97)
    );

  overflow: hidden;

  animation: viewer-in 0.25s ease;
}

/*
 * 主色调氛围光
 */
.viewer-color-bg {
  position: absolute;

  inset: -15%;

  z-index: 0;

  pointer-events: none;

  filter: blur(100px);

  transform: scale(1.15);

  transition:
    background 0.7s ease,
    opacity 0.7s ease;
}

/*
 * 深色遮罩
 */
.viewer-overlay {
  position: absolute;

  inset: 0;

  z-index: 1;

  pointer-events: none;

  background:
    rgba(8, 10, 14, 0.52);
}

@keyframes viewer-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/*
 * 内容
 */
.viewer-content {
  position: relative;

  z-index: 2;

  width: min(1200px, 100%);

  max-height: calc(100vh - 80px);

  display: flex;

  flex-direction: column;

  align-items: center;

  min-width: 0;
}

/*
 * 图片区域
 */
.viewer-image-wrapper {
  position: relative;

  width: 100%;

  max-width: 1200px;

  max-height: calc(100vh - 260px);

  display: flex;

  align-items: center;

  justify-content: center;

  min-height: 100px;

  overflow: hidden;

  border-radius: 14px;
}

/*
 * 图片
 */
.viewer-image {
  display: block;

  max-width: 100%;

  max-height: calc(100vh - 260px);

  width: auto;

  height: auto;

  object-fit: contain;

  border-radius: 14px;

  user-select: none;

  -webkit-user-drag: none;

  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.42);

  transition:
    filter 0.35s ease,
    opacity 0.35s ease;
}

/*
 * Base64
 */
.viewer-image.is-placeholder {
  filter: blur(10px);

  transform: scale(1.02);
}

/*
 * 高清图
 */
.viewer-image.is-high-res {
  filter: none;

  transform: scale(1);

  animation: high-res-in 0.35s ease;
}

@keyframes high-res-in {
  from {
    opacity: 0.55;
  }

  to {
    opacity: 1;
  }
}

/*
 * Loading
 *
 * 在图片区域正中央显示，
 * Spinner 下方显示加载提示。
 */
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

/*
 * Spinner
 */
.viewer-spinner {
  width: 18px;

  height: 18px;

  flex-shrink: 0;

  border: 2px solid
    rgba(255, 255, 255, 0.24);

  border-top-color: #fff;

  border-radius: 50%;

  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/*
 * Loading 文字
 *
 * 位于 Spinner 正下方。
 */
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
    0 1px 5px rgba(0, 0, 0, 0.4);
}

/*
 * Spinner
 */
.viewer-spinner {
  width: 18px;

  height: 18px;

  border: 2px solid
    rgba(255, 255, 255, 0.24);

  border-top-color: #fff;

  border-radius: 50%;

  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/*
 * 错误提示
 */
.viewer-error {
  position: absolute;

  left: 50%;

  bottom: 16px;

  z-index: 6;

  transform: translateX(-50%);

  padding: 7px 12px;

  border-radius: 8px;

  color:
    rgba(255, 255, 255, 0.82);

  background:
    rgba(0, 0, 0, 0.55);

  backdrop-filter: blur(8px);

  -webkit-backdrop-filter: blur(8px);

  font-size: 12px;

  white-space: nowrap;
}

/*
 * 关闭按钮
 */
.viewer-close {
  position: fixed;

  top: 20px;

  right: 25px;

  z-index: 10;

  width: 44px;

  height: 44px;

  border: 1px solid
    rgba(255, 255, 255, 0.08);

  border-radius: 50%;

  color: #fff;

  background:
    rgba(255, 255, 255, 0.09);

  backdrop-filter: blur(12px);

  -webkit-backdrop-filter: blur(12px);

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

  transform: rotate(90deg);
}

/*
 * 左右按钮
 */
.viewer-nav {
  position: fixed;

  top: 50%;

  z-index: 10;

  width: 52px;

  height: 72px;

  border: 1px solid
    rgba(255, 255, 255, 0.07);

  border-radius: 16px;

  color: #fff;

  background:
    rgba(255, 255, 255, 0.07);

  backdrop-filter: blur(12px);

  -webkit-backdrop-filter: blur(12px);

  font-size: 50px;

  font-weight: 200;

  line-height: 1;

  cursor: pointer;

  transform: translateY(-50%);

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

/*
 * 信息
 */
.viewer-info {
  width: min(900px, 100%);

  margin-top: 18px;

  color: #fff;
}

/*
 * 日期 + 序号
 */
.viewer-meta {
  display: flex;

  align-items: center;

  gap: 10px;
}

.viewer-date {
  font-size: 12px;

  color:
    rgba(255, 255, 255, 0.55);
}

.viewer-counter {
  padding: 3px 7px;

  border-radius: 6px;

  color:
    rgba(255, 255, 255, 0.48);

  background:
    rgba(255, 255, 255, 0.07);

  font-size: 11px;
}

/*
 * 标题
 */
.viewer-info h2 {
  margin: 5px 0 5px;

  font-size: 20px;

  font-weight: 650;

  line-height: 1.4;

  letter-spacing: -0.01em;
}

/*
 * 描述
 */
.viewer-info p {
  margin: 0;

  max-width: 850px;

  font-size: 13px;

  line-height: 1.6;

  color:
    rgba(255, 255, 255, 0.68);
}

/*
 * 主色调按钮
 */
.viewer-color {
  margin-top: 12px;

  display: inline-flex;

  align-items: center;

  gap: 9px;

  height: 34px;

  padding: 0 10px 0 6px;

  border: 1px solid
    rgba(255, 255, 255, 0.09);

  border-radius: 9px;

  color:
    rgba(255, 255, 255, 0.78);

  background:
    rgba(255, 255, 255, 0.065);

  backdrop-filter: blur(10px);

  -webkit-backdrop-filter: blur(10px);

  font-family: inherit;

  cursor: pointer;

  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    transform 0.2s ease;
}

.viewer-color:hover {
  background:
    rgba(255, 255, 255, 0.11);

  border-color:
    rgba(255, 255, 255, 0.15);

  transform: translateY(-1px);
}

.viewer-color:active {
  transform: translateY(0);
}

.viewer-color.copied {
  border-color:
    rgba(255, 255, 255, 0.2);
}

/*
 * 主色调色块
 */
.color-preview {
  width: 21px;

  height: 21px;

  flex-shrink: 0;

  border-radius: 6px;

  box-shadow:
    inset 0 0 0 1px
      rgba(255, 255, 255, 0.2),
    0 2px 8px
      rgba(0, 0, 0, 0.18);
}

/*
 * HEX
 */
.color-name {
  font-size: 12px;

  font-weight: 600;

  letter-spacing: 0.03em;
}

/*
 * 复制
 */
.color-copy {
  padding-left: 2px;

  color:
    rgba(255, 255, 255, 0.42);

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

/*
 * 操作区域
 */
.viewer-actions {
  display: flex;

  gap: 10px;

  margin-top: 13px;
}

.download-button,
.open-button {
  height: 38px;

  padding: 0 16px;

  border-radius: 10px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

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
  transform: translateY(-1px);
}

.download-button:active,
.open-button:active {
  transform: translateY(0);
}

/*
 * 下载
 */
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

/*
 * 打开原图
 */
.open-button {
  color: #fff;

  background:
    rgba(255, 255, 255, 0.08);

  border: 1px solid
    rgba(255, 255, 255, 0.1);

  backdrop-filter: blur(10px);

  -webkit-backdrop-filter: blur(10px);
}

.open-button:hover {
  background:
    rgba(255, 255, 255, 0.13);
}

/*
 * 移动端
 */
@media (max-width: 700px) {
  .viewer {
    padding: 20px;
  }

  .viewer-content {
    max-height:
      calc(100vh - 40px);
  }

  .viewer-image-wrapper {
    max-height:
      calc(100vh - 220px);

    border-radius: 9px;
  }

  .viewer-image {
    max-height:
      calc(100vh - 220px);

    border-radius: 9px;
  }

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

  .viewer-close {
    top: 10px;

    right: 10px;

    width: 40px;

    height: 40px;

    font-size: 27px;
  }

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

  .viewer-color {
    margin-top: 9px;
  }

  .viewer-actions {
    margin-top: 10px;
  }

  .download-button,
  .open-button {
    height: 36px;

    padding: 0 13px;

    font-size: 12px;
  }
  .viewer-loading {
    inset: 0;

    width: auto;

    height: auto;

    background: transparent;

    backdrop-filter: none;

    -webkit-backdrop-filter: none;

    box-shadow: none;
  }

  .viewer-loading-text {
    margin-top: 8px;

    font-size: 11px;
  }

  .viewer-spinner {
    width: 16px;

    height: 16px;
  }
}
</style>

