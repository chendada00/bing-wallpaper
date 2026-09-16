<template>
  <Teleport to="body">
    <div
      class="viewer"
      @click.self="close"
    >
      <button
        class="viewer-close"
        aria-label="关闭"
        @click="close"
      >
        ×
      </button>

      <button
        v-if="hasPrevious"
        class="viewer-nav viewer-prev"
        aria-label="上一张"
        @click="previous"
      >
        ‹
      </button>

      <button
        v-if="hasNext"
        class="viewer-nav viewer-next"
        aria-label="下一张"
        @click="next"
      >
        ›
      </button>

      <div class="viewer-content">
        <div class="viewer-image-wrapper">
          <div
            v-if="imageLoading"
            class="viewer-loading"
          >
            <span class="viewer-spinner" />
          </div>

          <img
            :src="item?.image"
            :alt="item?.title || item?.date"
            class="viewer-image"
            @load="imageLoading = false"
            @error="imageError = true"
          >
        </div>

        <div class="viewer-info">
          <div class="viewer-date">
            {{ item?.date }}
          </div>

          <h2>
            {{ item?.title || 'Bing Wallpaper' }}
          </h2>

          <p>
            {{ item?.description || item?.copyright || '' }}
          </p>

          <div class="viewer-actions">
            <button
              class="download-button"
              :disabled="downloading"
              @click="downloadImage"
            >
              <span v-if="downloading">下载中...</span>
              <span v-else>下载原图</span>
            </button>

            <a
              class="open-button"
              :href="item?.image"
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

const imageLoading = ref(true)
const imageError = ref(false)
const downloading = ref(false)

const currentIndex = computed(() => {
  if (!props.item) return -1

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

watch(
  () => props.item,
  () => {
    imageLoading.value = true
    imageError.value = false
  }
)

function close() {
  emit('close')
}

function previous() {
  if (!hasPrevious.value) return

  emit(
    'change',
    props.items[currentIndex.value - 1]
  )
}

function next() {
  if (!hasNext.value) return

  emit(
    'change',
    props.items[currentIndex.value + 1]
  )
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    close()
  }

  if (event.key === 'ArrowLeft') {
    previous()
  }

  if (event.key === 'ArrowRight') {
    next()
  }
}

async function downloadImage() {
  if (!props.item?.image || downloading.value) {
    return
  }

  downloading.value = true

  try {
    const response = await fetch(props.item.image)

    if (!response.ok) {
      throw new Error('Download failed')
    }

    const blob = await response.blob()

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url
    link.download = `${props.item.date || 'bing-wallpaper'}.jpg`

    document.body.appendChild(link)

    link.click()

    link.remove()

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  } catch (error) {
    console.error('下载失败:', error)

    window.open(
      props.item.image,
      '_blank',
      'noopener,noreferrer'
    )
  } finally {
    downloading.value = false
  }
}

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

  background: rgba(8, 10, 14, 0.94);

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  animation: viewer-in 0.25s ease;
}

@keyframes viewer-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.viewer-content {
  width: min(1200px, 100%);
  max-height: calc(100vh - 80px);

  display: flex;
  flex-direction: column;
  align-items: center;
}

.viewer-image-wrapper {
  position: relative;

  max-width: 100%;
  max-height: calc(100vh - 260px);

  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-image {
  display: block;

  max-width: 100%;
  max-height: calc(100vh - 260px);

  object-fit: contain;

  border-radius: 12px;

  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.45);
}

.viewer-loading {
  position: absolute;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-spinner {
  width: 32px;
  height: 32px;

  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;

  border-radius: 50%;

  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.viewer-close {
  position: fixed;

  top: 20px;
  right: 25px;

  width: 44px;
  height: 44px;

  border: 0;
  border-radius: 50%;

  color: #fff;
  background: rgba(255, 255, 255, 0.1);

  font-size: 30px;
  line-height: 1;

  cursor: pointer;

  transition:
    background 0.25s ease,
    transform 0.25s ease;
}

.viewer-close:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: rotate(90deg);
}

.viewer-nav {
  position: fixed;

  top: 50%;

  width: 52px;
  height: 72px;

  border: 0;
  border-radius: 16px;

  color: #fff;
  background: rgba(255, 255, 255, 0.08);

  font-size: 50px;
  font-weight: 200;
  line-height: 1;

  cursor: pointer;

  transform: translateY(-50%);

  transition:
    background 0.25s ease,
    transform 0.25s ease;
}

.viewer-nav:hover {
  background: rgba(255, 255, 255, 0.15);
}

.viewer-prev {
  left: 24px;
}

.viewer-next {
  right: 24px;
}

.viewer-info {
  width: min(900px, 100%);

  margin-top: 20px;

  color: #fff;
}

.viewer-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.viewer-info h2 {
  margin: 5px 0 5px;

  font-size: 20px;
  font-weight: 650;
}

.viewer-info p {
  margin: 0;

  font-size: 13px;
  line-height: 1.6;

  color: rgba(255, 255, 255, 0.68);
}

.viewer-actions {
  display: flex;
  gap: 10px;

  margin-top: 14px;
}

.download-button,
.open-button {
  height: 38px;

  padding: 0 16px;

  border-radius: 10px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: 13px;
  font-weight: 600;

  text-decoration: none;

  cursor: pointer;
}

.download-button {
  border: 0;

  color: #111;
  background: #fff;
}

.download-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.open-button {
  color: #fff;

  background: rgba(255, 255, 255, 0.1);

  border: 1px solid rgba(255, 255, 255, 0.12);
}

@media (max-width: 700px) {
  .viewer {
    padding: 20px;
  }

  .viewer-content {
    max-height: calc(100vh - 40px);
  }

  .viewer-image {
    max-height: calc(100vh - 220px);
    border-radius: 8px;
  }

  .viewer-nav {
    width: 40px;
    height: 52px;

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
  }

  .viewer-info {
    margin-top: 14px;
  }
}
</style>