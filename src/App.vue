<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import EndState from './components/EndState.vue'
import ImageViewer from './components/ImageViewer.vue'
import LoadingState from './components/LoadingState.vue'
import WallpaperCard from './components/WallpaperCard.vue'
import { useBingData } from './composables/useBingData'

const { items, loading, initialLoading, error, noMore, loadInitial, loadNextMonth, retry } = useBingData()
const selected = ref(null)
const sentinel = ref(null)
const showBackTop = ref(false)
let observer

const today = computed(() => {
  if (!items.value.length) return null
  const now = new Date()
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return items.value.find((item) => item.date === key) || items.value[0]
})

const remainingItems = computed(() => {
  if (!today.value) return items.value
  return items.value.filter((item) => item.date !== today.value.date)
})

function openViewer(item) {
  selected.value = item
}

function closeViewer() {
  selected.value = null
}

function onScroll() {
  showBackTop.value = window.scrollY > 700
}

function backTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function onRetry() {
  await retry()
}

onMounted(async () => {
  await loadInitial()
  await nextTick()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadNextMonth()
    },
    { rootMargin: '900px 0px' },
  )

  if (sentinel.value) observer.observe(sentinel.value)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="#top" aria-label="Bing Wallpaper 首页">
          <span class="brand-mark">
            <span class="brand-sun"></span>
            <span class="brand-mountain"></span>
          </span>
          <span>
            <strong>Bing Wallpaper</strong>
            <small>每日高清壁纸</small>
          </span>
        </a>
        <div class="header-meta">
          <span>{{ items.length }} 张已收藏</span>
        </div>
      </div>
    </header>

    <main id="top">
      <section class="hero" :style="today?.color?.Vibrant ? { '--accent': today.color.Vibrant } : {}">
        <div class="hero-bg" :style="today ? { backgroundImage: `url(${today.preview || today.image})` } : {}"></div>
        <div class="hero-overlay"></div>

        <div class="hero-inner">
          <div v-if="initialLoading" class="hero-loading">
            <span class="spinner"></span>
            <span>正在寻找今日壁纸…</span>
          </div>

          <template v-else-if="today">
            <div class="hero-copy">
              <span class="eyebrow">TODAY · BING DAILY</span>
              <h1>{{ today.title }}</h1>
              <p>{{ today.description }}</p>
              <div class="hero-actions">
                <button class="primary-button" type="button" @click="openViewer(today)">
                  查看原图
                  <span>↗</span>
                </button>
                <span class="hero-date">{{ today.date }}</span>
              </div>
            </div>
          </template>

          <div v-else class="hero-copy empty-hero">
            <span class="eyebrow">BING DAILY</span>
            <h1>暂无壁纸数据</h1>
            <p>请检查数据仓库或稍后刷新页面。</p>
          </div>
        </div>
      </section>

      <section class="gallery-section">
        <div class="section-heading">
          <div>
            <span class="eyebrow dark">ARCHIVE</span>
            <h2>壁纸收藏</h2>
            <p>不按月份分类，沿时间顺序持续加载。</p>
          </div>
          <div class="collection-count">{{ items.length }} 张</div>
        </div>

        <LoadingState v-if="initialLoading" />

        <template v-else>
          <div v-if="error" class="error-state">
            <span>{{ error }}</span>
            <button type="button" @click="onRetry">重新加载</button>
          </div>

          <div v-if="remainingItems.length" class="wallpaper-grid">
            <WallpaperCard
              v-for="item in remainingItems"
              :key="item.date"
              :item="item"
              @open="openViewer"
            />
          </div>

          <div ref="sentinel" class="load-sentinel" aria-hidden="true"></div>

          <div v-if="loading && !initialLoading" class="load-more">
            <span class="spinner"></span>
            <span>正在继续加载历史壁纸…</span>
          </div>

          <EndState v-else-if="noMore" />
        </template>
      </section>
    </main>

    <footer class="site-footer">
      <div>
        <strong>Bing Wallpaper</strong>
        <span>·</span>
        <span>每日保存，永久收藏</span>
      </div>
      <a href="https://github.com/chendada00/bing-data" target="_blank" rel="noopener noreferrer">数据仓库 ↗</a>
    </footer>

    <button v-show="showBackTop" class="back-top" type="button" aria-label="返回顶部" @click="backTop">
      ↑
    </button>

    <ImageViewer :item="selected" @close="closeViewer" />
  </div>
</template>
