<template>
    <button
      v-if="hasStory"
      ref="triggerRef"
      type="button"
      class="ai-story-trigger"
      :class="`ai-story-trigger--${variant}`"
      :style="themeStyle"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-label="`查看 ${item?.date || ''} 的 AI 解读`"
      @click.stop="open"
    >
      <svg
        class="ai-story-trigger-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
        <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
      </svg>
      <span>AI 视界</span>
    </button>

    <Teleport to="body">
      <Transition name="ai-story-dialog">
        <div
          v-if="isOpen && hasStory"
          class="ai-story-backdrop"
          :style="themeStyle"
          @click.self="close"
        >
          <section
            ref="dialogRef"
            class="ai-story-dialog"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="`${dialogId}-title`"
            :aria-describedby="`${dialogId}-body`"
            @click.stop
          >
            <div class="ai-story-dialog-glow" aria-hidden="true" />
            <div class="ai-story-dialog-accent-line" aria-hidden="true" />

            <header class="ai-story-header">
              <div class="ai-story-heading-mark" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
                  <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
                </svg>
              </div>

              <div class="ai-story-heading-copy">
                <strong>光影札记</strong>
                <span>每一幕都有未说完的故事</span>
              </div>

              <div class="ai-story-header-actions">
                <!-- 导出截图 -->
                <button
                  type="button"
                  class="ai-story-export"
                  :disabled="isExporting"
                  :title="exportError || '导出完整卡片为高清 PNG'"
                  data-export-hide
                  @click="exportCard"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 17v3h14v-3" />
                  </svg>

                  <span aria-live="polite">
                    {{ isExporting ? '生成中…' : exportStatus || '导出长图' }}
                  </span>
                </button>

                <!-- 关闭按钮：导出时隐藏 -->
                <button
                  ref="closeRef"
                  type="button"
                  class="ai-story-close"
                  aria-label="关闭 AI 解读"
                  data-export-hide
                  @click="close"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </header>


            <div class="ai-story-scroll">
              <div class="ai-story-meta" v-if="item?.date">
                <span class="ai-story-date-mark" />
                <span>{{ item.date }}</span>
                <span v-if="aiStory.generatedAt" class="ai-story-generated">
                  生成于 {{ formatDate(aiStory.generatedAt) }}
                </span>
              </div>

              <div class="ai-story-intro">
                <div class="ai-story-title-block">
                  <p class="ai-story-kicker">A LITTLE STORY BEHIND THE VIEW</p>
                  <h2 :id="`${dialogId}-title`">
                    {{ aiStory.title || item?.title || '这一刻的风景' }}
                  </h2>
                  <p v-if="aiStory.subtitle" class="ai-story-subtitle">
                    {{ aiStory.subtitle }}
                  </p>
                </div>

                <figure v-if="previewUrl && !previewFailed" class="ai-story-preview">
                  <img
                    :src="previewUrl"
                    :alt="`${item?.date || ''} 壁纸预览图`"
                    loading="eager"
                    decoding="async"
                    referrerpolicy="no-referrer"
                    @error="previewFailed = true"
                  />
                </figure>
              </div>

              <div class="ai-story-divider">
                <span />
                <span />
                <span />
              </div>

              <section class="ai-story-section" :id="`${dialogId}-body`">
                <!-- 一级标题：保留原来的意境漫游 -->
                <div class="ai-story-section-heading">
                  <span class="ai-story-section-index">01</span>
                  <h3>意境漫游</h3>
                </div>

                <!-- 有多个段落时，拆分为两个小标题 -->
                <template v-if="storyParagraphs.length >= 2">
                  <div class="ai-story-subsection">
                    <h4 class="ai-story-subheading">① 光影与景致</h4>
                    <p class="ai-story-body">
                      {{ storyParagraphs[0] }}
                    </p>
                  </div>

                  <div class="ai-story-subsection">
                    <h4 class="ai-story-subheading">② 画面之外</h4>
                    <p class="ai-story-body">
                      {{ storyParagraphs.slice(1).join('\n\n') }}
                    </p>
                  </div>
                </template>

                <!-- 单段兼容：保留一级标题，正文不添加小标题 -->
                <p v-else class="ai-story-body">
                  {{ storyParagraphs[0] || aiStory.story }}
                </p>
              </section>
              <section v-if="moodTags.length" class="ai-story-section ai-story-tags-section">
                <div class="ai-story-section-heading">
                  <span class="ai-story-section-index">02</span>
                  <h3>心境回声</h3>
                </div>
                <div class="ai-story-tags">
                  <span
                    v-for="(tag, index) in moodTags"
                    :key="`mood-${index}-${tag}`"
                    class="ai-story-tag ai-story-tag--mood"
                  >{{ tag }}</span>
                </div>
              </section>

              <section v-if="visualTags.length" class="ai-story-section ai-story-visual-section">
                <div class="ai-story-section-heading">
                  <span class="ai-story-section-index">03</span>
                  <h3>细节之诗</h3>
                </div>
                <div class="ai-story-tags">
                  <span
                    v-for="(tag, index) in visualTags"
                    :key="`visual-${index}-${tag}`"
                    class="ai-story-tag ai-story-tag--visual"
                  >{{ tag }}</span>
                </div>
              </section>

              <footer class="ai-story-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
                <span>AI 生成内容，仅供欣赏与参考</span>
              </footer>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
</template>


<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch
} from 'vue'

import { toBlob } from 'html-to-image'

const props = defineProps({
  item: {
    type: Object,
    default: null
  },
  accentColor: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'card',
    validator: value => ['card', 'viewer'].includes(value)
  }
})

const dialogId = useId()

const isOpen = ref(false)
const triggerRef = ref(null)
const closeRef = ref(null)
const dialogRef = ref(null)

// 截图状态
const isExporting = ref(false)
const exportStatus = ref('')
const exportError = ref('')

let previousBodyOverflow = ''

const aiStory = computed(() => {
  const value = props.item?.aiStory
  return value && typeof value === 'object' ? value : {}
})

const hasStory = computed(() => {
  return typeof aiStory.value.story === 'string' &&
    aiStory.value.story.trim().length > 0
})

/**
 * 将 AI Story 按段落拆分。
 *
 * 兼容：
 * 1. Windows 换行符 \r\n
 * 2. Unix 换行符 \n
 * 3. 连续空行
 * 4. 首尾空白
 * 5. 只有一段的旧数据
 *
 * 至少存在两个段落时，前段用于画面解读，
 * 后续段落合并为画面升华。
 */
const storyParagraphs = computed(() => {
  const story = aiStory.value.story

  if (typeof story !== 'string' || !story.trim()) {
    return []
  }

  return story
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n\s*\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
})

function normalizeTags(value) {
  if (!Array.isArray(value)) return []

  return value
    .filter(item => typeof item === 'string' && item.trim())
    .map(item => item.trim())
    .slice(0, 8)
}

const moodTags = computed(() => normalizeTags(aiStory.value.mood))
const visualTags = computed(() => normalizeTags(aiStory.value.visualElements))

// 只使用月度数据中的 preview
const previewFailed = ref(false)

const previewUrl = computed(() => {
  const value = props.item?.preview

  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  try {
    const url = new URL(
      value,
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://localhost'
    )

    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
})

watch(() => props.item?.preview, () => {
  previewFailed.value = false
})

const palette = computed(() => {
  const colors = props.item?.color || {}

  const priority = [
    props.accentColor,
    colors.Vibrant,
    colors.LightVibrant,
    colors.DarkVibrant,
    colors.Muted,
    colors.LightMuted,
    colors.DarkMuted
  ]

  return [...new Set(priority.filter(value => {
    return typeof value === 'string' &&
      /^#[0-9a-fA-F]{6}$/.test(value)
  }).map(value => value.toUpperCase()))].slice(0, 5)
})

const themeStyle = computed(() => ({
  '--ai-accent': palette.value[0] || '#9588df',
  '--ai-accent-2': palette.value[1] || '#c2a2dc',
  '--ai-accent-3': palette.value[2] || '#86a9b7'
}))

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function open() {
  if (!hasStory.value) return
  isOpen.value = true
}

function close() {
  isOpen.value = false
}


/**
 * 生成安全文件名。
 */
function createExportFilename() {
  const date = props.item?.date || 'wallpaper'

  const title =
    aiStory.value.title ||
    props.item?.title ||
    'AI解读'

  const safeTitle = String(title)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)

  return `Bing-AI-${date}-${safeTitle}.png`
}


/**
 * 导出完整 AI 解读卡片。
 *
 * 原始弹窗保持不动。
 * 使用 cloneNode 创建独立导出 DOM。
 * 复用当前预览图片的 src，不主动重新加载图片，
 * 不调用 fetch、decode 或 cacheBust。
 */
async function exportCard() {
  const source = dialogRef.value

  if (!source || isExporting.value) {
    return
  }

  isExporting.value = true
  exportStatus.value = ''
  exportError.value = ''

  let exportRoot = null
  let objectUrl = null

  try {
    // 1. 等待 Vue DOM 更新
    await nextTick()

    // 2. 等待字体，避免导出字体布局不一致
    if (document.fonts?.ready) {
      await document.fonts.ready
    }

    // 导出采用统一的画布宽度，不再依赖手机或桌面当前弹窗宽度
    const width = 560

    if (!width || width < 100) {
      throw new Error('无法获取有效的卡片宽度')
    }

    // 4. 克隆原始卡片，不修改正在显示的 DOM
    const clone = source.cloneNode(true)

    // 5. 移除不需要导出的按钮
    clone.querySelectorAll('[data-export-hide]')
      .forEach(node => node.remove())

    // 6. 移除装饰性光晕
    clone.querySelectorAll('.ai-story-dialog-glow')
      .forEach(node => node.remove())

    // 7. 标记导出 DOM
    clone.classList.add('ai-story-export-root')

    // 8. 直接将当前主题颜色应用到克隆节点
    Object.entries(themeStyle.value).forEach(
      ([key, value]) => {
        clone.style.setProperty(key, value)
      }
    )

    // 9. 创建屏幕外容器
    exportRoot = document.createElement('div')
    
    Object.assign(exportRoot.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
    
      // 外层容器与内部导出卡片保持一致
      width: `${width}px`,
      minWidth: `${width}px`,
      maxWidth: `${width}px`,
    
      height: 'auto',
      overflow: 'visible',
    
      pointerEvents: 'none',
      zIndex: '-1',
    
      background: 'transparent',
      boxSizing: 'border-box'
    })

    exportRoot.appendChild(clone)
    document.body.appendChild(exportRoot)

    // 10. 等待独立 DOM 布局完成
    await nextTick()

    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve)
      })
    })

    // 11. 计算完整卡片尺寸
    const cloneRect = clone.getBoundingClientRect()

    const exportWidth = Math.ceil(cloneRect.width)

    const exportHeight = Math.ceil(
      Math.max(
        clone.scrollHeight,
        cloneRect.height
      )
    )

    if (
      !Number.isFinite(exportWidth) ||
      !Number.isFinite(exportHeight) ||
      exportWidth <= 0 ||
      exportHeight <= 0
    ) {
      throw new Error(
        `导出尺寸异常：${exportWidth} × ${exportHeight}`
      )
    }

    // 12. 限制 Canvas 尺寸和像素数量
    const pixelRatio = Math.max(
      1,
      Math.min(
        3,
        16000 / Math.max(exportWidth, exportHeight),
        Math.sqrt(
          24000000 / (exportWidth * exportHeight)
        )
      )
    )

    console.log('AI 解读导出尺寸：', {
      width: exportWidth,
      height: exportHeight,
      pixelRatio
    })

    // 13. 导出克隆 DOM
    const blob = await toBlob(clone, {
      pixelRatio,
      width: exportWidth,
      height: exportHeight,

      // 不使用缓存规避参数
      cacheBust: false,

      // 卡片本身有 CSS 背景
      backgroundColor: '#17191f',

      // 过滤导出按钮等节点
      filter: node => {
        return !(
          node instanceof HTMLElement &&
          node.hasAttribute('data-export-hide')
        )
      }
    })

    if (!blob || blob.size === 0) {
      throw new Error('导出 PNG 失败，未生成有效图片')
    }

    // 14. 下载文件
    objectUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = objectUrl
    link.download = createExportFilename()

    document.body.appendChild(link)
    link.click()
    link.remove()

    exportStatus.value = '已保存'

  } catch (error) {
    console.error('AI 解读卡片导出失败：', error)

    exportStatus.value = '导出失败'

    exportError.value =
      error?.message || '请稍后重试'

  } finally {
    // 15. 清理独立 DOM
    exportRoot?.remove()

    // 16. 释放文件地址
    if (objectUrl) {
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 3000)
    }

    // 17. 恢复导出状态
    isExporting.value = false
  }
}



/**
 * ESC 关闭弹窗。
 */
function handleDocumentKeydown(event) {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    close()
  }
}

/**
 * 弹窗打开和关闭时管理页面滚动。
 */
watch(isOpen, async opened => {
  if (typeof document === 'undefined') return

  if (opened) {
    previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    await nextTick()

    closeRef.value?.focus()

  } else {
    document.body.style.overflow = previousBodyOverflow

    await nextTick()

    triggerRef.value?.focus()
  }
})

onMounted(() => {
  document.addEventListener(
    'keydown',
    handleDocumentKeydown
  )
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener(
      'keydown',
      handleDocumentKeydown
    )

    if (isOpen.value) {
      document.body.style.overflow =
        previousBodyOverflow
    }
  }
})
</script>

<style scoped>
.ai-story-trigger {
  --ai-accent: #9588df;
  --ai-accent-2: #c2a2dc;

  position: relative;
  z-index: 5;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 11px;
  border: 1px solid color-mix(in srgb, var(--ai-accent) 48%, rgba(255,255,255,.42));
  border-radius: 10px;
  color: #fff;
  background:
    linear-gradient(135deg,
      color-mix(in srgb, var(--ai-accent) 48%, rgba(24,25,32,.72)),
      rgba(20,21,27,.62));
  box-shadow:
    0 4px 14px rgba(0,0,0,.16),
    inset 0 1px 0 rgba(255,255,255,.18);
  backdrop-filter: blur(14px) saturate(135%);
  -webkit-backdrop-filter: blur(14px) saturate(135%);
  font: inherit;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: .02em;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform .2s ease, border-color .2s ease, background .2s ease, box-shadow .2s ease;
}

.ai-story-trigger:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ai-accent) 72%, white);
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--ai-accent) 62%, rgba(24,25,32,.68)),
    rgba(20,21,27,.68));
  box-shadow: 0 6px 18px color-mix(in srgb, var(--ai-accent) 24%, transparent), inset 0 1px 0 rgba(255,255,255,.22);
}

.ai-story-trigger:active {
  transform: scale(.97);
}

.ai-story-trigger:focus-visible,
.ai-story-close:focus-visible {
  outline: 2px solid var(--ai-accent);
  outline-offset: 3px;
}

.ai-story-trigger-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--ai-accent-2) 55%, white);
}

.ai-story-trigger--viewer {
  min-height: 38px;
  padding: 0 14px;
  font-size: 12px;
}

.ai-story-trigger--viewer .ai-story-trigger-icon {
  width: 16px;
  height: 16px;
}

.ai-story-backdrop {
  --ai-accent: #9588df;
  --ai-accent-2: #c2a2dc;
  --ai-accent-3: #86a9b7;

  position: fixed;
  inset: 0;
  z-index: 10030;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  background: rgba(7, 9, 14, .66);
  backdrop-filter: blur(13px) saturate(115%);
  -webkit-backdrop-filter: blur(13px) saturate(115%);
}

.ai-story-dialog {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  width: min(560px, 100%);
  max-height: min(760px, calc(100dvh - 48px));
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.17);
  border-radius: 23px;
  color: #f7f7fa;
  background:
    linear-gradient(145deg, rgba(35,37,45,.97), rgba(18,20,27,.985) 62%);
  box-shadow:
    0 32px 100px rgba(0,0,0,.48),
    0 0 70px color-mix(in srgb, var(--ai-accent) 15%, transparent),
    inset 0 1px 0 rgba(255,255,255,.08);
}

.ai-story-dialog-glow {
  position: absolute;
  z-index: -1;
  top: -190px;
  right: -120px;
  width: 440px;
  height: 360px;
  border-radius: 50%;
  background:
    radial-gradient(circle,
      color-mix(in srgb, var(--ai-accent) 34%, transparent) 0%,
      color-mix(in srgb, var(--ai-accent-2) 17%, transparent) 38%,
      transparent 72%);
  filter: blur(12px);
  pointer-events: none;
}

.ai-story-dialog-accent-line {
  position: absolute;
  top: 0;
  left: 8%;
  right: 8%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ai-accent), var(--ai-accent-2), var(--ai-accent-3), transparent);
  opacity: .9;
}

.ai-story-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 21px 23px 17px;
  border-bottom: 1px solid rgba(255,255,255,.075);
}

.ai-story-heading-mark {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--ai-accent) 48%, rgba(255,255,255,.18));
  border-radius: 13px;
  color: color-mix(in srgb, var(--ai-accent) 72%, white);
  background: linear-gradient(145deg,
    color-mix(in srgb, var(--ai-accent) 25%, rgba(255,255,255,.08)),
    rgba(255,255,255,.035));
  box-shadow: 0 5px 20px color-mix(in srgb, var(--ai-accent) 14%, transparent);
}

.ai-story-heading-mark svg {
  width: 21px;
  height: 21px;
}

.ai-story-heading-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.ai-story-heading-copy strong {
  color: rgba(255,255,255,.96);
  font-size: 14px;
  font-weight: 700;
}

.ai-story-heading-copy span {
  color: rgba(255,255,255,.43);
  font-size: 10px;
  letter-spacing: .04em;
}

.ai-story-close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 11px;
  color: rgba(255,255,255,.7);
  background: rgba(255,255,255,.055);
  cursor: pointer;
  transition: background .18s ease, transform .18s ease, color .18s ease;
}

.ai-story-close:hover {
  color: #fff;
  background: rgba(255,255,255,.12);
  transform: rotate(5deg);
}

.ai-story-close svg {
  width: 17px;
  height: 17px;
}

.ai-story-scroll {
  position: relative;

  flex: 1 1 auto;
  min-height: 0;

  overflow-x: hidden;
  overflow-y: auto;

  padding: 20px 25px 22px;

  overscroll-behavior: contain;

  -webkit-overflow-scrolling: touch;

  touch-action: pan-y;
}

.ai-story-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: rgba(255,255,255,.43);
  font-size: 10px;
  letter-spacing: .04em;
}

.ai-story-date-mark {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ai-accent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--ai-accent) 65%, transparent);
}

.ai-story-generated {
  margin-left: auto;
  color: rgba(255,255,255,.32);
}

.ai-story-title-block {
  margin-top: 20px;
}

.ai-story-kicker {
  margin: 0 0 9px;
  color: color-mix(in srgb, var(--ai-accent) 76%, #ddd);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .16em;
}

.ai-story-title-block h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(25px, 5vw, 34px);
  font-weight: 720;
  line-height: 1.22;
  letter-spacing: -.035em;
  text-wrap: balance;
}

.ai-story-subtitle {
  margin: 9px 0 0;
  color: color-mix(in srgb, var(--ai-accent-2) 55%, rgba(255,255,255,.75));
  font-size: 13px;
  line-height: 1.65;
}

.ai-story-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(150px, 220px);
  align-items: center;
  gap: 18px;
  margin-top: 18px;
}

.ai-story-intro .ai-story-title-block {
  min-width: 0;
  margin-top: 0;
}

.ai-story-preview {
  width: 100%;
  max-width: 220px;
  max-height: 124px;
  aspect-ratio: 16 / 9;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 12px;
  background: rgba(255,255,255,.045);
  box-shadow: 0 8px 24px rgba(0,0,0,.2);
}

.ai-story-preview img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 124px;
  object-fit: cover;
}


.ai-story-divider {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 21px 0 19px;
}

.ai-story-divider span:first-child {
  width: 32px;
  height: 2px;
  border-radius: 2px;
  background: var(--ai-accent);
}

.ai-story-divider span:nth-child(2) {
  width: 13px;
  height: 2px;
  border-radius: 2px;
  background: var(--ai-accent-2);
  opacity: .7;
}

.ai-story-divider span:nth-child(3) {
  width: 5px;
  height: 2px;
  border-radius: 2px;
  background: var(--ai-accent-3);
  opacity: .55;
}

.ai-story-section + .ai-story-section {
  margin-top: 21px;
}

.ai-story-section-heading {
  display: flex;
  align-items: baseline;
  gap: 9px;
  margin-bottom: 9px;
}

.ai-story-section-index {
  color: color-mix(in srgb, var(--ai-accent) 70%, rgba(255,255,255,.42));
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  letter-spacing: .06em;
}

.ai-story-section-heading h3 {
  margin: 0;
  color: rgba(255,255,255,.88);
  font-size: 13px;
  font-weight: 680;
}

.ai-story-body {
  margin: 0;
  color: rgba(241,242,246,.75);
  font-size: 13px;
  line-height: 2;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.ai-story-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-story-tag {
  display: inline-flex;
  align-items: center;
  min-height: 27px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.4;
}

.ai-story-tag--mood {
  border-color: color-mix(in srgb, var(--ai-accent) 28%, rgba(255,255,255,.1));
  color: color-mix(in srgb, var(--ai-accent) 52%, #f5f1ff);
  background: color-mix(in srgb, var(--ai-accent) 13%, rgba(255,255,255,.035));
}

.ai-story-tag--visual {
  color: rgba(255,255,255,.68);
  background: rgba(255,255,255,.045);
}

.ai-story-footer {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 23px;
  padding-top: 13px;
  border-top: 1px solid rgba(255,255,255,.07);
  color: rgba(255,255,255,.34);
  font-size: 10px;
}

.ai-story-footer svg {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--ai-accent) 60%, #999);
}

.ai-story-dialog-enter-active,
.ai-story-dialog-leave-active {
  transition: opacity .2s ease;
}

.ai-story-dialog-enter-active .ai-story-dialog,
.ai-story-dialog-leave-active .ai-story-dialog {
  transition: transform .24s cubic-bezier(.2,.8,.2,1), opacity .2s ease;
}

.ai-story-dialog-enter-from,
.ai-story-dialog-leave-to {
  opacity: 0;
}

.ai-story-dialog-enter-from .ai-story-dialog,
.ai-story-dialog-leave-to .ai-story-dialog {
  opacity: 0;
  transform: translateY(12px) scale(.985);
}

@media (max-width: 640px) {
  .ai-story-backdrop {
    align-items: flex-end;
    padding: 0;
    background: rgba(5,7,12,.58);
  }

  .ai-story-dialog {
    width: 100%;
    max-height: min(84dvh, 760px);
    border-radius: 22px 22px 0 0;
    border-bottom: 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .ai-story-header {
    padding: 17px 18px 14px;
  }

  .ai-story-scroll {
    padding: 17px 19px 22px;
  }

  .ai-story-intro {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    margin-top: 17px;
  }

  .ai-story-preview {
    max-width: 100%;
    max-height: 190px;
    aspect-ratio: 16 / 9;
  }

  .ai-story-preview img {
    max-height: 190px;
  }

  .ai-story-title-block {
    margin-top: 0;
  }

  .ai-story-title-block h2 {
    font-size: 27px;
  }

  .ai-story-body {
    font-size: 12px;
    line-height: 1.9;
  }

  .ai-story-generated {
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-story-trigger,
  .ai-story-close,
  .ai-story-dialog-enter-active,
  .ai-story-dialog-leave-active,
  .ai-story-dialog-enter-active .ai-story-dialog,
  .ai-story-dialog-leave-active .ai-story-dialog {
    transition: none;
  }
}


/* ================================
   AI 解读卡片截图导出按钮
================================ */

.ai-story-header-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
}

.ai-story-export {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  min-height: 34px;
  padding: 0 11px;

  border: 1px solid color-mix(
    in srgb,
    var(--ai-accent) 48%,
    rgba(255,255,255,.18)
  );

  border-radius: 10px;

  color: rgba(255,255,255,.9);

  background: color-mix(
    in srgb,
    var(--ai-accent) 16%,
    rgba(255,255,255,.055)
  );

  font: inherit;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;

  cursor: pointer;

  transition:
    background .2s ease,
    border-color .2s ease,
    transform .2s ease,
    opacity .2s ease;
}

.ai-story-export:hover:not(:disabled) {
  background: color-mix(
    in srgb,
    var(--ai-accent) 28%,
    rgba(255,255,255,.08)
  );

  border-color: var(--ai-accent);

  transform: translateY(-1px);
}

.ai-story-export:active:not(:disabled) {
  transform: scale(.97);
}

.ai-story-export:disabled {
  opacity: .55;
  cursor: wait;
}

.ai-story-export svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
}

.ai-story-export:focus-visible {
  outline: 2px solid var(--ai-accent);
  outline-offset: 3px;
}

/* 手机端 */
@media (max-width: 640px) {
  .ai-story-header-actions {
    gap: 6px;
  }

  .ai-story-export {
    min-height: 32px;
    padding: 0 9px;
    font-size: 10px;
  }

  .ai-story-export svg {
    width: 14px;
    height: 14px;
  }
}

/* ================================
   AI 解读独立导出布局
================================ */

/* 导出卡片固定为桌面布局宽度 */
.ai-story-export-root {
  width: 560px !important;
  min-width: 560px !important;
  max-width: 560px !important;

  height: auto !important;
  max-height: none !important;

  overflow: visible !important;

  transform: none !important;
  animation: none !important;
  transition: none !important;

  position: relative !important;

  display: flex !important;
  flex-direction: column !important;

  flex: none !important;

  box-sizing: border-box !important;

  border-radius: 23px !important;
}

/* 导出时展开滚动容器 */
.ai-story-export-root .ai-story-scroll {
  width: 100% !important;
  min-width: 0 !important;

  height: auto !important;
  max-height: none !important;

  overflow: visible !important;

  flex: none !important;

  overscroll-behavior: auto !important;
  -webkit-overflow-scrolling: auto !important;

  box-sizing: border-box !important;
}

/* 导出时固定标题和图片的横向布局 */
.ai-story-export-root .ai-story-intro {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) minmax(150px, 220px) !important;
  align-items: center !important;
  gap: 18px !important;
}

/* 导出时统一预览图尺寸 */
.ai-story-export-root .ai-story-preview {
  width: 100% !important;
  max-width: 220px !important;
  max-height: 124px !important;

  aspect-ratio: 16 / 9 !important;

  overflow: hidden !important;

  border-radius: 12px !important;
}

.ai-story-export-root .ai-story-preview img {
  display: block !important;

  width: 100% !important;
  height: 100% !important;

  max-height: 124px !important;

  object-fit: cover !important;
}

/* 导出标题统一字号 */
.ai-story-export-root .ai-story-title-block h2 {
  font-size: 34px !important;
}

/* 导出正文统一字号 */
.ai-story-export-root .ai-story-body {
  font-size: 13px !important;
  line-height: 2 !important;
}

/* 心境回声：明确横向 Flex 布局 */
.ai-story-export-root .ai-story-tags-section .ai-story-tags {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;

  align-items: center !important;
  justify-content: flex-start !important;

  gap: 8px !important;

  width: 100% !important;
  min-width: 0 !important;

  box-sizing: border-box !important;
}

/* 心境回声标签：保持内容宽度，不压缩 */
.ai-story-export-root .ai-story-tag--mood {
  display: inline-flex !important;
  flex-direction: row !important;

  align-items: center !important;
  justify-content: center !important;

  flex: 0 0 auto !important;

  width: auto !important;
  max-width: none !important;

  min-height: 27px !important;

  white-space: nowrap !important;

  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;

  box-sizing: border-box !important;
}

/* 导出标签区域 */
.ai-story-export-root .ai-story-tags-section {
  width: 100% !important;
  min-width: 0 !important;
}

/* 导出时移除动态效果 */
.ai-story-export-root *,
.ai-story-export-root *::before,
.ai-story-export-root *::after {
  animation: none !important;
  transition: none !important;
  transform: none !important;
}

/* 不导出装饰光晕 */
.ai-story-export-root .ai-story-dialog-glow {
  display: none !important;
}

/* 顶部装饰线保持正常显示 */
.ai-story-export-root .ai-story-dialog-accent-line {
  opacity: 1 !important;
}

/* AI 解读二级小标题容器 */
.ai-story-subsection + .ai-story-subsection {
  margin-top: 20px;
}

/* 二级小标题 */
.ai-story-subheading {
  display: flex;
  align-items: center;
  gap: 8px;

  margin: 0 0 8px;

  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.06em;
}

/* 小标题前的细线 */
.ai-story-subheading::before {
  content: '';
  display: block;
  flex-shrink: 0;

  width: 2px;
  height: 12px;

  border-radius: 2px;
  background: var(--ai-accent);
  opacity: 0.75;
}
</style>
