
<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'

const props = defineProps({
  downloading: {
    type: Boolean,
    default: false
  },

  downloadProgress: {
    type: Number,
    default: 0
  },

  downloadLoaded: {
    type: Number,
    default: 0
  },

  downloadTotal: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['action'])

const panelRef = ref(null)

const open = ref(false)
const dragging = ref(false)

const position = ref({
  x: 0,
  y: 0
})

const panelPlacement = ref('left-up')

const buttonSize = ref(52)

const margin = 12
const dragThreshold = 5

let pointerStart = null
let suppressClick = false
let suppressClickTimer = null
let resizeObserver = null

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

const panelStyle = computed(() => ({
  '--toolbar-panel-max-height':
    `${Math.max(160, window.innerHeight * 0.65)}px`
}))

function getButtonSize() {
  return window.innerWidth <= 700 ? 48 : 52
}

function clampPosition(x, y) {
  const size = buttonSize.value

  const maxX = Math.max(
    margin,
    window.innerWidth - size - margin
  )

  const maxY = Math.max(
    margin,
    window.innerHeight - size - margin
  )

  return {
    x: Math.max(margin, Math.min(x, maxX)),
    y: Math.max(margin, Math.min(y, maxY))
  }
}

function initPosition() {
  buttonSize.value = getButtonSize()

  position.value = clampPosition(
    window.innerWidth - buttonSize.value - 24,
    window.innerHeight - buttonSize.value - 100
  )
}

function updatePanelPlacement() {
  const size = buttonSize.value

  const x = position.value.x
  const y = position.value.y

  const rightSpace =
    window.innerWidth - x - size

  const leftSpace = x

  const bottomSpace =
    window.innerHeight - y - size

  const topSpace = y

  const horizontal =
    rightSpace >= 276 || leftSpace < 276
      ? 'right'
      : 'left'

  const vertical =
    topSpace >= 300 || bottomSpace < 300
      ? 'up'
      : 'down'

  panelPlacement.value =
    `${horizontal}-${vertical}`
}

function onPointerDown(event) {
  if (event.button !== undefined && event.button !== 0) {
    return
  }

  if (event.target.closest('.floating-panel')) {
    return
  }

  dragging.value = true
  open.value = false

  pointerStart = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: position.value.x,
    originY: position.value.y,
    moved: false
  }

  event.currentTarget.setPointerCapture(
    event.pointerId
  )
}

function onPointerMove(event) {
  if (!dragging.value || !pointerStart) {
    return
  }

  const dx =
    event.clientX - pointerStart.startX

  const dy =
    event.clientY - pointerStart.startY

  if (
    Math.abs(dx) > dragThreshold ||
    Math.abs(dy) > dragThreshold
  ) {
    pointerStart.moved = true
  }

  if (!pointerStart.moved) {
    return
  }

  position.value = clampPosition(
    pointerStart.originX + dx,
    pointerStart.originY + dy
  )
}

function onPointerUp(event) {
  if (!dragging.value || !pointerStart) {
    return
  }

  dragging.value = false

  if (pointerStart.moved) {
    const middle =
      window.innerWidth / 2

    const centerX =
      position.value.x + buttonSize.value / 2

    const snappedX =
      centerX < middle
        ? margin
        : window.innerWidth -
          buttonSize.value -
          margin

    position.value = clampPosition(
      snappedX,
      position.value.y
    )

    suppressClick = true

    if (suppressClickTimer) {
      clearTimeout(suppressClickTimer)
    }

    suppressClickTimer = setTimeout(() => {
      suppressClick = false
      suppressClickTimer = null
    }, 250)
  }

  pointerStart = null

  updatePanelPlacement()
}

function togglePanel() {
  if (suppressClick) {
    suppressClick = false
    return
  }

  open.value = !open.value

  if (open.value) {
    updatePanelPlacement()
  }
}

function handleAction(action) {
  emit('action', action)
  open.value = false
}

function handleOutsideClick(event) {
  if (!open.value) {
    return
  }

  const root =
    document.querySelector('.floating-toolbar-root')

  if (root && !root.contains(event.target)) {
    open.value = false
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
  }
}

function onResize() {
  buttonSize.value = getButtonSize()

  position.value = clampPosition(
    position.value.x,
    position.value.y
  )

  updatePanelPlacement()
}

onMounted(() => {
  initPosition()

  window.addEventListener('resize', onResize)

  document.addEventListener(
    'pointerdown',
    handleOutsideClick
  )

  document.addEventListener(
    'keydown',
    handleKeydown
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'resize',
    onResize
  )

  document.removeEventListener(
    'pointerdown',
    handleOutsideClick
  )

  document.removeEventListener(
    'keydown',
    handleKeydown
  )

  if (suppressClickTimer) {
    clearTimeout(suppressClickTimer)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div
    class="floating-toolbar-root"
    :class="{
      'is-open': open,
      'is-dragging': dragging
    }"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      '--toolbar-size': buttonSize + 'px'
    }"
  >
    <!-- 悬浮球 -->
    <button
      type="button"
      class="floating-trigger"
      aria-label="壁纸操作"
      :aria-expanded="open"
      aria-controls="floating-toolbar-panel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click="togglePanel"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </svg>
    </button>

    <!-- 操作面板 -->
    <Transition name="floating-panel">
      <div
        v-if="open"
        ref="panelRef"
        id="floating-toolbar-panel"
        class="floating-panel"
        :class="panelPlacement"
        :style="panelStyle"
      >
        <div class="floating-panel-header">
          <span>壁纸操作</span>

          <button
            type="button"
            class="floating-panel-close"
            aria-label="关闭操作面板"
            @click="open = false"
          >
            ×
          </button>
        </div>

        <div class="floating-panel-content">
          <button
            type="button"
            class="floating-action"
            :disabled="props.downloading"
            @click="handleAction('download')"
          >
            <span class="floating-action-icon">
              ↓
            </span>

            <span class="floating-download-content">
              <span>
                {{ props.downloading ? '下载中...' : '下载原图' }}
              </span>

              <span
                v-if="props.downloading"
                class="floating-download-progress"
              >
                <span
                  class="floating-download-progress-bar"
                  :style="{
                    width: `${props.downloadProgress}%`
                  }"
                />
              </span>

              <span
                v-if="props.downloading"
                class="floating-download-text"
              >
                <template v-if="props.downloadTotal">
                  {{ props.downloadProgress }}%
                  ·
                  {{ formatBytes(props.downloadLoaded) }}
                  /
                  {{ formatBytes(props.downloadTotal) }}
                </template>

                <template v-else>
                  下载中...
                </template>
              </span>
            </span>
          </button>

          <button
            type="button"
            class="floating-action"
            @click="handleAction('open')"
          >
            <span class="floating-action-icon">
              ↗
            </span>
            <span>打开原图</span>
          </button>

          <button
            type="button"
            class="floating-action"
            @click="handleAction('share')"
          >
            <span class="floating-action-icon">
              ⧉
            </span>
            <span>分享链接</span>
          </button>

          <button
            type="button"
            class="floating-action"
            @click="handleAction('immersive')"
          >
            <span class="floating-action-icon">
              ⛶
            </span>
            <span>沉浸式浏览</span>
          </button>

          <!-- AI 解读等额外内容 -->
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.floating-toolbar-root {
  position: fixed;
  z-index: 10020;
  width: var(--toolbar-size);
  height: var(--toolbar-size);
}

.floating-trigger {
  display: flex;
  align-items: center;
  justify-content: center;

  width: var(--toolbar-size);
  height: var(--toolbar-size);

  padding: 0;

  color: rgba(255, 255, 255, 0.95);

  background: rgba(18, 22, 30, 0.78);

  border: 1px solid rgba(255, 255, 255, 0.22);

  border-radius: 50%;

  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  cursor: pointer;

  touch-action: none;
  user-select: none;
  -webkit-user-select: none;

  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.floating-trigger:hover {
  background: rgba(35, 42, 54, 0.92);

  transform: scale(1.05);

  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.floating-trigger:active {
  transform: scale(0.96);
}

.is-dragging .floating-trigger {
  transform: scale(1.08);
  cursor: grabbing;
}

.floating-panel {
  position: absolute;

  width: 264px;

  max-width:
    calc(100vw - 24px);

  max-height:
    var(--toolbar-panel-max-height);

  overflow-y: auto;

  padding: 12px;

  box-sizing: border-box;

  border:
    1px solid rgba(255, 255, 255, 0.14);

  border-radius: 16px;

  color: rgba(255, 255, 255, 0.95);

  background:
    rgba(15, 19, 27, 0.88);

  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.42);

  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);

  scrollbar-width: thin;
}

.floating-panel.left-up {
  right: calc(var(--toolbar-size) + 12px);
  bottom: 0;
}

.floating-panel.left-down {
  right: calc(var(--toolbar-size) + 12px);
  top: 0;
}

.floating-panel.right-up {
  left: calc(var(--toolbar-size) + 12px);
  bottom: 0;
}

.floating-panel.right-down {
  left: calc(var(--toolbar-size) + 12px);
  top: 0;
}

.floating-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  min-height: 34px;

  padding: 0 4px 8px;

  font-size: 14px;
  font-weight: 650;

  border-bottom:
    1px solid rgba(255, 255, 255, 0.1);
}

.floating-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 32px;
  height: 32px;

  padding: 0;

  border: 0;
  border-radius: 50%;

  color: rgba(255, 255, 255, 0.8);

  background: transparent;

  font-size: 24px;

  cursor: pointer;
}

.floating-panel-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.floating-panel-content {
  display: flex;
  flex-direction: column;

  gap: 4px;

  padding-top: 8px;
}

.floating-action {
  display: flex;
  align-items: center;

  gap: 12px;

  width: 100%;
  min-height: 46px;

  padding: 10px 12px;

  box-sizing: border-box;

  color: rgba(255, 255, 255, 0.9);

  background: transparent;

  border: 0;
  border-radius: 10px;

  text-align: left;

  font-family: inherit;
  font-size: 13px;

  cursor: pointer;

  transition:
    background 0.18s ease,
    transform 0.18s ease;
}

.floating-action:hover {
  background: rgba(255, 255, 255, 0.1);
}

.floating-action:active {
  transform: scale(0.98);
}

.floating-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 26px;
  height: 26px;

  flex-shrink: 0;

  border-radius: 8px;

  background: rgba(255, 255, 255, 0.08);

  font-size: 16px;
}

.floating-panel-enter-active,
.floating-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.floating-panel-enter-from,
.floating-panel-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.is-dragging {
  transition: none;
}

/* 移动端 */
@media (max-width: 700px) {
  .floating-toolbar-root {
    z-index: 10020;
  }

  .floating-panel {
    width: min(264px, calc(100vw - 24px));

    max-height:
      min(65vh, calc(100dvh - 40px));

    padding: 10px;

    border-radius: 14px;
  }

  .floating-action {
    min-height: 48px;

    padding: 12px;
  }
}

/* 减少动态效果 */
@media (prefers-reduced-motion: reduce) {
  .floating-panel-enter-active,
  .floating-panel-leave-active,
  .floating-trigger {
    transition: none;
  }
}

.floating-download-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.floating-download-progress {
  position: relative;
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.floating-download-progress-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #fff;
  transition: width 0.15s ease;
}

.floating-download-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

.floating-action:disabled {
  cursor: wait;
  opacity: 0.7;
}
</style>
