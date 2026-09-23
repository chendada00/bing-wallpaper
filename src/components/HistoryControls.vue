<template>
  <div class="history-controls" ref="root">
    <button
      type="button"
      class="history-more-button"
      :class="{ active: menuOpen || loading }"
      :disabled="loading"
      title="更多操作"
      aria-label="更多操作"
      @click="menuOpen = !menuOpen"
    >
      <span class="history-more-dot"></span>
      <span class="history-more-dot"></span>
      <span class="history-more-dot"></span>
    </button>

    <Transition name="history-menu">
      <div v-if="menuOpen" class="history-menu">
        <button
          type="button"
          class="history-menu-item"
          :disabled="loading"
          @click="requestLoadAll"
        >
          <span class="history-menu-icon">↗</span>
          <span class="history-menu-copy">
            <strong>加载全部历史</strong>
            <small>可能增加内存和页面负担</small>
          </span>
        </button>

        <div class="history-shortcut">
          <span>快捷键</span>
          <kbd>Alt</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>H</kbd>
        </div>
      </div>
    </Transition>

    <Transition name="history-dialog">
      <div v-if="confirmOpen" class="history-dialog-backdrop" @click.self="confirmOpen = false">
        <div class="history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-dialog-title">
          <div class="history-dialog-icon">∞</div>
          <h2 id="history-dialog-title">加载全部历史壁纸？</h2>
          <p>
            这会持续把历史壁纸数据加入当前页面。历史数据较多时，浏览器会占用更多内存，
            页面可能出现卡顿，低性能手机会更明显；图片加载也会产生较多网络流量。
          </p>
          <p class="history-dialog-tip">
            如果只是查找某张旧壁纸，建议使用「全历史」搜索。
          </p>
          <div class="history-dialog-actions">
            <button type="button" class="history-cancel" @click="confirmOpen = false">
              取消
            </button>
            <button type="button" class="history-confirm" @click="confirmLoadAll">
              继续加载
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="history-toast">
      <div v-if="loading" class="history-loading-toast">
        <span class="history-spinner"></span>
        <span>正在加载历史壁纸…</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load-all'])

const root = ref(null)
const menuOpen = ref(false)
const confirmOpen = ref(false)

function requestLoadAll() {
  menuOpen.value = false
  confirmOpen.value = true
}

function confirmLoadAll() {
  confirmOpen.value = false
  emit('load-all')
}

function handleDocumentPointerdown(event) {
  if (!root.value?.contains(event.target)) {
    menuOpen.value = false
  }
}

function handleKeydown(event) {
  if (
    event.altKey &&
    event.shiftKey &&
    event.key.toLowerCase() === 'h'
  ) {
    event.preventDefault()

    if (!props.loading) {
      confirmOpen.value = true
      menuOpen.value = false
    }
  }

  if (event.key === 'Escape') {
    menuOpen.value = false
    confirmOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerdown)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerdown)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.history-controls {
  position: relative;
  flex-shrink: 0;
}

.history-more-button {
  width: 30px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  transition: background .25s ease, transform .25s ease;
}

.history-more-button:hover,
.history-more-button.active {
  background: rgba(0, 0, 0, .055);
}

.history-more-button:active {
  transform: scale(.92);
}

.history-more-button:disabled {
  opacity: .55;
  cursor: default;
}

.history-more-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: .65;
}

.history-menu {
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  z-index: 150;
  width: 230px;
  padding: 8px;
  border: 1px solid rgba(255,255,255,.72);
  border-radius: 14px;
  background: rgba(255,255,255,.9);
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 18px 48px rgba(0,0,0,.14);
}

.history-menu-item {
  width: 100%;
  padding: 9px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
}

.history-menu-item:hover {
  background: rgba(0,0,0,.045);
  transform: translateX(-2px);
}

.history-menu-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.055);
  font-size: 14px;
}

.history-menu-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-menu-copy strong {
  font-size: 12px;
  color: #333;
}

.history-menu-copy small {
  font-size: 10px;
  color: #999;
}

.history-shortcut {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 6px 8px 3px;
  color: #aaa;
  font-size: 9px;
}

.history-shortcut kbd {
  min-width: 17px;
  padding: 2px 4px;
  border: 1px solid rgba(0,0,0,.08);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: rgba(0,0,0,.025);
  font-size: 9px;
  line-height: 1;
}

.history-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0,0,0,.25);
  backdrop-filter: blur(5px);
}

.history-dialog {
  width: min(430px, 100%);
  padding: 25px;
  border: 1px solid rgba(255,255,255,.75);
  border-radius: 20px;
  background: rgba(255,255,255,.94);
  box-shadow: 0 28px 90px rgba(0,0,0,.2);
  animation: history-dialog-in .35s cubic-bezier(.16,1,.3,1);
}

.history-dialog-icon {
  width: 38px;
  height: 38px;
  margin-bottom: 12px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.06);
  color: #333;
  font-size: 22px;
}

.history-dialog h2 {
  margin: 0;
  font-size: 18px;
}

.history-dialog p {
  margin: 12px 0 0;
  color: #666;
  font-size: 12px;
  line-height: 1.75;
}

.history-dialog-tip {
  color: #999 !important;
}

.history-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.history-dialog-actions button {
  min-width: 76px;
  height: 34px;
  padding: 0 13px;
  border-radius: 9px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  transition: transform .2s ease, background .2s ease;
}

.history-dialog-actions button:active {
  transform: scale(.96);
}

.history-cancel {
  border: 1px solid rgba(0,0,0,.08);
  background: rgba(0,0,0,.035);
  color: #666;
}

.history-confirm {
  border: 0;
  background: #151515;
  color: #fff;
}

.history-loading-toast {
  position: fixed;
  left: 50%;
  bottom: 22px;
  z-index: 900;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border: 1px solid rgba(255,255,255,.7);
  border-radius: 12px;
  background: rgba(30,30,30,.86);
  color: #fff;
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 34px rgba(0,0,0,.18);
  font-size: 11px;
  white-space: nowrap;
}

.history-spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: history-spin .7s linear infinite;
}

.history-menu-enter-active,
.history-menu-leave-active,
.history-dialog-enter-active,
.history-dialog-leave-active,
.history-toast-enter-active,
.history-toast-leave-active {
  transition: opacity .2s ease, transform .25s cubic-bezier(.16,1,.3,1);
}

.history-menu-enter-from,
.history-menu-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(.98);
}

.history-dialog-enter-from,
.history-dialog-leave-to {
  opacity: 0;
}

.history-toast-enter-from,
.history-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

@keyframes history-dialog-in {
  from { opacity: 0; transform: translateY(10px) scale(.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes history-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 700px) {
  .history-shortcut {
    display: none;
  }

  .history-menu {
    width: 205px;
  }
}

@media (prefers-color-scheme: dark) {
  .history-more-button:hover,
  .history-more-button.active { background: rgba(255,255,255,.08); }
  .history-menu,
  .history-dialog { background: rgba(28,28,28,.94); color: #eee; border-color: rgba(255,255,255,.1); }
  .history-menu-copy strong,
  .history-dialog h2 { color: #eee; }
  .history-menu-copy small,
  .history-dialog p { color: #aaa; }
  .history-menu-item:hover { background: rgba(255,255,255,.06); }
  .history-menu-icon { background: rgba(255,255,255,.08); }
  .history-shortcut kbd { border-color: rgba(255,255,255,.1); background: rgba(255,255,255,.04); }
  .history-cancel { border-color: rgba(255,255,255,.1); background: rgba(255,255,255,.06); color: #bbb; }
  .history-confirm { background: #fff; color: #111; }
}
</style>
