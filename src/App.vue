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

        <div class="header-info">
          {{ items.length }} wallpapers
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
          @click="openViewer(item)"
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

const totalCount = computed(() => {
  return items.value.length
})

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

  if (loading.value || initialLoading.value || noMore.value) {
    return
  }

  await loadNextMonth()
}

onMounted(async () => {
  await loadInitial()

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
.error-state {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.error-state button {
  margin-left: 10px;
  padding: 7px 14px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
</style>