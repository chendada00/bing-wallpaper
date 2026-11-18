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
      <span>AI 解读</span>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
                  <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
                </svg>
              </div>

              <div class="ai-story-heading-copy">
                <strong>AI 解读</strong>
                <span>由 AI 生成的画面解读</span>
              </div>

              <button
                ref="closeRef"
                type="button"
                class="ai-story-close"
                aria-label="关闭 AI 解读"
                @click="close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div class="ai-story-scroll">
              <div class="ai-story-meta" v-if="item?.date">
                <span class="ai-story-date-mark" />
                <span>{{ item.date }}</span>
                <span v-if="aiStory.generatedAt" class="ai-story-generated">
                  生成于 {{ formatDate(aiStory.generatedAt) }}
                </span>
              </div>

              <div class="ai-story-title-block">
                <p class="ai-story-kicker">A LITTLE STORY BEHIND THE VIEW</p>
                <h2 :id="`${dialogId}-title`">
                  {{ aiStory.title || item?.title || '这一刻的风景' }}
                </h2>
                <p v-if="aiStory.subtitle" class="ai-story-subtitle">
                  {{ aiStory.subtitle }}
                </p>
              </div>

              <div class="ai-story-divider">
                <span />
                <span />
                <span />
              </div>

              <section class="ai-story-section" :id="`${dialogId}-body`">
                <div class="ai-story-section-heading">
                  <span class="ai-story-section-index">01</span>
                  <h3>意境漫游</h3>
                </div>
                <p class="ai-story-body">{{ aiStory.story }}</p>
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
let previousBodyOverflow = ''

const aiStory = computed(() => {
  const value = props.item?.aiStory
  return value && typeof value === 'object' ? value : {}
})

const hasStory = computed(() => {
  return typeof aiStory.value.story === 'string' &&
    aiStory.value.story.trim().length > 0
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
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
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
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)

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

function handleDocumentKeydown(event) {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    close()
  }
}

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
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', handleDocumentKeydown)
    if (isOpen.value) {
      document.body.style.overflow = previousBodyOverflow
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
  z-index: 10000;
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
  overflow: auto;
  padding: 20px 25px 22px;
  overscroll-behavior: contain;
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

  .ai-story-title-block {
    margin-top: 17px;
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
</style>
