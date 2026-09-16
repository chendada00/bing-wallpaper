<template>
  <div class="app">
    <header class="site-header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-icon">
            B
          </div>

          <div class="brand-text">
            <div class="brand-title">Bing Wallpaper</div>
            <div class="brand-subtitle">Every day, a new view</div>
          </div>
        </div>

        <div class="header-info">
          <span>{{ totalCount }} wallpapers</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="intro">
        <div>
          <div class="eyebrow">MICROSOFT BING</div>
          <h1>Daily Wallpapers</h1>
          <p>
            每一张壁纸，都记录着一天的风景。
          </p>
        </div>
      </section>

      <section class="wallpaper-grid">
        <WallpaperCard
          v-for="item in items"
          :key="item.date"
          :item="item"
          @click="openViewer(item)"
        />
      </section>

      <LoadingState v-if="loading" />

      <EndState
        v-if="!loading && finished"
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
import { computed, onMounted, ref } from 'vue'
import WallpaperCard from './components/WallpaperCard.vue'
import ImageViewer from './components/ImageViewer.vue'
import LoadingState from './components/LoadingState.vue'
import EndState from './components/EndState.vue'
import { useBingData } from './composables/useBingData'

const {
  items,
  loading,
  finished,
  loadMore,
  init
} = useBingData()

const viewerVisible = ref(false)
const currentItem = ref(null)
const loadMoreTrigger = ref(null)

const totalCount = computed(() => items.value.length)

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
  if (!item) return
  currentItem.value = item
}

onMounted(async () => {
  await init()

  if (!loadMoreTrigger.value) return

  const observer = new IntersectionObserver(
    async entries => {
      if (!entries[0].isIntersecting) return

      if (!loading.value && !finished.value) {
        await loadMore()
      }
    },
    {
      rootMargin: '800px 0px'
    }
  )

  observer.observe(loadMoreTrigger.value)
})
</script>