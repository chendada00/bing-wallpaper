<template>
  <Teleport to="body">
    <Transition name="toast-bounce">
      <div
        v-if="visible"
        class="notice-toast-wrapper"
        @mouseenter="pauseAutoClose"
        @mouseleave="startAutoClose"
      >
        <div class="notice-toast-card">
          <!-- 动态响铃/波纹 SVG 图标 -->
          <div class="notice-toast-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="bell-animated"
            >
              <!-- 摇摆的铃铛主体 -->
              <path class="bell-body" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path class="bell-clapper" d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              
              <!-- 动态声波弧线 -->
              <path class="sound-wave wave-1" d="M21 6a9 9 0 0 1 0 12"></path>
              <path class="sound-wave wave-2" d="M23 3a13 13 0 0 1 0 18"></path>
            </svg>
          </div>

          <!-- 内容区 -->
          <div class="notice-toast-content">
            <h4 v-if="notice.title" class="notice-toast-title">
              {{ notice.title }}
            </h4>
            <p class="notice-toast-body">
              {{ notice.content }}
            </p>
            <a
              v-if="notice.link"
              :href="notice.link"
              target="_blank"
              rel="noopener noreferrer"
              class="notice-toast-link"
            >
              {{ notice.linkText || '查看详情' }}
            </a>
          </div>

          <!-- 关闭按钮 -->
          <button
            @click="dismiss"
            class="notice-toast-close"
            title="关闭通知"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const visible = ref(false)
const notice = ref({
  id: '',
  title: '',
  content: '',
  link: '',
  linkText: '',
  autoClose: 0
})

let timer = null

const startAutoClose = () => {
  const seconds = Number(notice.value.autoClose) || 0
  if (seconds > 0 && visible.value) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      dismiss()
    }, seconds * 1000)
  }
}

const pauseAutoClose = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

onMounted(async () => {
  try {
    const NOTICE_API =
      import.meta.env.VITE_JSONBIN_URL

    const ACCESS_KEY =
      import.meta.env.VITE_JSONBIN_ACCESS_KEY

    const res = await fetch(
      `${NOTICE_API}?t=${Date.now()}`,
      {
        headers: {
          'X-Access-Key': ACCESS_KEY,
          'X-Bin-Meta': 'false'
        }
      }
    )

    if (!res.ok) return
    const data = await res.json()

    if (!data || !data.enabled || !data.content) return

    const dismissedNoticeId = localStorage.getItem('dismissed_notice_id')
    if (dismissedNoticeId === data.id) return

    notice.value = data
    visible.value = true

    startAutoClose()
  } catch (err) {
    console.error('[NoticeToast] 加载 notice.json 失败:', err)
  }
})

const dismiss = () => {
  visible.value = false
  pauseAutoClose()
  if (notice.value.id) {
    localStorage.setItem('dismissed_notice_id', notice.value.id)
  }
}

onBeforeUnmount(() => {
  pauseAutoClose()
})
</script>

<style scoped>
/* 1. 定位与结构 */
.notice-toast-wrapper {
  position: fixed;
  top: 96px;
  right: 24px;
  z-index: 99999;
  max-width: 360px;
  width: calc(100vw - 48px);
  pointer-events: none;
}

.notice-toast-card {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(18, 18, 20, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 
    0 20px 40px -10px rgba(0, 0, 0, 0.5),
    0 0 20px 0 rgba(255, 255, 255, 0.05) inset;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.notice-toast-card:hover {
  background: rgba(18, 18, 20, 0.8);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 24px 48px -8px rgba(0, 0, 0, 0.6),
    0 0 24px 0 rgba(255, 255, 255, 0.1) inset;
}

/* 2. 动态 SVG 铃铛与声波动画 */
.notice-toast-icon {
  margin-top: 2px;
  color: #60a5fa; /* 天蓝色突出图标 */
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell-animated {
  transform-origin: top center;
  animation: bell-ring 3s infinite ease-in-out;
}

.sound-wave {
  opacity: 0;
  transform-origin: center;
}

.wave-1 {
  animation: wave-pulse 2s infinite 0.2s ease-in-out;
}

.wave-2 {
  animation: wave-pulse 2s infinite 0.5s ease-in-out;
}

/* 铃铛晃动 Keyframes */
@keyframes bell-ring {
  0%, 100% { transform: rotate(0deg); }
  5% { transform: rotate(14deg); }
  10% { transform: rotate(-12deg); }
  15% { transform: rotate(8deg); }
  20% { transform: rotate(-6deg); }
  25% { transform: rotate(0deg); }
}

/* 声波扩散 Keyframes */
@keyframes wave-pulse {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: scale(1.1);
  }
}

/* 3. 文案与组件样式 */
.notice-toast-content {
  flex: 1;
  min-width: 0;
}

.notice-toast-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
}

.notice-toast-body {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  word-break: break-word;
}

.notice-toast-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #60a5fa;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.notice-toast-link:hover {
  color: #93c5fd;
}

.notice-toast-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  padding: 4px;
  margin: -4px -4px 0 0;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.notice-toast-close:hover {
  color: rgba(255, 255, 255, 0.9);
  background-color: rgba(255, 255, 255, 0.1);
}

@media (max-width: 640px) {
  .notice-toast-wrapper {
    top: 76px;
    right: 16px;
    width: calc(100vw - 32px);
  }
}

/* 4. 强视觉对比的回弹弹性动画 (Bounce Transition) */
.toast-bounce-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-bounce-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.toast-bounce-enter-from {
  opacity: 0;
  transform: translateY(-24px) scale(0.85) rotate(2deg);
}

.toast-bounce-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.92);
}
</style>