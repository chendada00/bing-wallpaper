<template>
  <div class="app">
    <header class="site-header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-icon">B</div>

          <div class="brand-text">
            <div class="brand-title">Bing Wallpaper</div>
            <div class="brand-subtitle">
              Every day, a new view
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="header-info">
            {{ items.length }} wallpapers
          </div>

          <div class="header-links">
            <a
              href="https://github.com/chendada00/bing-wallpaper"
              target="_blank"
              rel="noopener noreferrer"
              title="前端源码"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
                />
              </svg>

              <span>源码</span>
            </a>

            <a
              href="https://github.com/chendada00/bing-data"
              target="_blank"
              rel="noopener noreferrer"
              title="壁纸数据"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M3.5 5.5A2.5 2.5 0 0 1 6 3h4.2c.66 0 1.3.26 1.77.73l1.07 1.07c.47.47 1.1.73 1.77.73H18A2.5 2.5 0 0 1 20.5 8v8.5A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-11Z"
                />
              </svg>

              <span>数据</span>
            </a>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="intro">
        <div>
          <div class="eyebrow">A collection of beautiful moments.</div>
          <h1>伴随·光影</h1>
          <p>每日一景，长久珍藏。</p>
        </div>
      </section>

      <section
        v-if="items.length > 0"
        class="wallpaper-grid"
      >
        <WallpaperCard
          v-for="item in items"
          :key="item.date"
          :item="item"
          :should-load="imageLoadQueue.has(item.date)"
          @click="openViewer(item)"
          @image-loaded="handleImageLoaded"
          @image-error="handleImageError"
        />
      </section>

      <LoadingState
        v-if="initialLoading || loading"
      />

      <div
        v-if="error"
        class="error-state"
      >
        {{ error }}

        <button @click="retry">
          重试
        </button>
      </div>

      <EndState
        v-if="!loading && !initialLoading && noMore"
      />

      <div
        ref="loadMoreTrigger"
        class="load-more-trigger"
      />
    </main>

    <ImageViewer
      v-if="viewerVisible"
      :item="currentItem"
      :items="items"
      @close="closeViewer"
      @change="changeViewer"
    />
  </div>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'

import WallpaperCard from './components/WallpaperCard.vue'
import ImageViewer from './components/ImageViewer.vue'
import LoadingState from './components/LoadingState.vue'
import EndState from './components/EndState.vue'

import { useBingData } from './composables/useBingData'

const {
  items,
  loading,
  initialLoading,
  error,
  noMore,
  loadInitial,
  loadNextMonth,
  retry
} = useBingData()

const viewerVisible = ref(false)
const currentItem = ref(null)
const loadMoreTrigger = ref(null)

let observer = null
/**
 * 同时允许加载的图片数量
 */
const IMAGE_CONCURRENCY = 6

/**
 * 当前允许开始加载的图片
 */
const imageLoadQueue = ref(new Set())

/**
 * 已经进入过加载队列的图片
 *
 * 防止同一张图片重复进入队列
 */
const startedImages = new Set()

/**
 * 当前正在加载中的图片
 */
const loadingImages = new Set()
const totalCount = computed(() => {
  return items.value.length
})


function fillImageLoadQueue() {
  while (
    loadingImages.size < IMAGE_CONCURRENCY
  ) {
    const nextItem = items.value.find(item => {
      return (
        item?.date &&
        !startedImages.has(item.date)
      )
    })

    if (!nextItem) {
      break
    }

    startedImages.add(nextItem.date)
    loadingImages.add(nextItem.date)

    imageLoadQueue.value = new Set([
      ...imageLoadQueue.value,
      nextItem.date
    ])
  }
}

function handleImageLoaded(date) {
  loadingImages.delete(date)

  fillImageLoadQueue()
}

function handleImageError(date) {
  loadingImages.delete(date)

  fillImageLoadQueue()
}

function openViewer(item) {
  currentItem.value = item
  viewerVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closeViewer() {
  viewerVisible.value = false
  currentItem.value = null
  document.body.style.overflow = ''
}

function changeViewer(item) {
  if (item) {
    currentItem.value = item
  }
}

async function handleLoadMore(entries) {
  if (!entries[0]?.isIntersecting) {
    return
  }

  if (
    loading.value ||
    initialLoading.value ||
    noMore.value
  ) {
    return
  }

  await loadNextMonth()

  fillImageLoadQueue()
}

onMounted(async () => {
  await loadInitial()

  // 首次加载完成后启动图片加载队列
  fillImageLoadQueue()

  if (!loadMoreTrigger.value) {
    return
  }

  observer = new IntersectionObserver(
    handleLoadMore,
    {
      rootMargin: '800px 0px'
    }
  )

  observer.observe(loadMoreTrigger.value)
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
  }

  document.body.style.overflow = ''
})
</script>

<style scoped>
.header-right {
  display: flex;
  align-items: center;
  gap: 22px;
}

.header-info {
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  white-space: nowrap;
}

.header-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-links a {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  gap: 7px;

  height: 34px;
  padding: 0 13px;

  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 9px;

  /* 强制使用深色文字 */
  color: #1f2937 !important;

  /* 浅色半透明背景 */
  background: rgba(255, 255, 255, 0.92) !important;

  text-decoration: none !important;

  font-size: 12px;
  font-weight: 600;
  line-height: 1;

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.15);

  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.header-links a:hover {
  color: #111827 !important;
  background: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.75);

  transform: translateY(-1px);

  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.22);
}

.header-links a:visited {
  color: #1f2937 !important;
}

.header-links a:active {
  color: #111827 !important;
}

.header-links svg {
  width: 15px;
  height: 15px;

  fill: currentColor !important;

  opacity: 1;
  flex-shrink: 0;
}

.header-links a span {
  color: inherit !important;
}

/* 手机端只保留图标 */
@media (max-width: 640px) {
  .header-right {
    gap: 8px;
  }

  .header-info {
    display: none;
  }

  .header-links {
    gap: 5px;
  }

  .header-links a {
    width: 34px;
    padding: 0;
  }

  .header-links a span {
    display: none;
  }
}
</style>