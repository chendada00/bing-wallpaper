<template>
  <div class="app">

    <div class="ambient-background">

      <div
        class="ambient-background-layer"
        :class="{
          active: backgroundIndex === 0
        }"
        :style="{
          backgroundImage:
            backgroundLayers[0]?.base64
              ? 'url(' + backgroundLayers[0].base64 + ')'
              : 'none'
        }"
      />

      <div
        class="ambient-background-layer"
        :class="{
          active: backgroundIndex === 1
        }"
        :style="{
          backgroundImage:
            backgroundLayers[1]?.base64
              ? 'url(' + backgroundLayers[1].base64 + ')'
              : 'none'
        }"
      />

      <div class="ambient-background-sheen" />
      <div class="ambient-background-overlay" />

    </div>
<header class="site-header">

        <div class="header-inner">


          <div class="brand">

            <div class="brand-icon">
              B
            </div>


            <div class="brand-text">

              <div class="brand-title">
                Bing Wallpaper
              </div>


              <div class="brand-subtitle">
                Every day, a new view
              </div>

            </div>

          </div>



          <div class="header-right">


            <div class="header-info">
              {{ selectedMonth ? monthViewItems.length : items.length }}
              wallpapers
            </div>


            <SearchPanel
              v-if="items.length > 0 && !selectedMonth"
              v-model:keyword="keyword"
              v-model:date="date"
              v-model:color="color"
              v-model:scope="scope"
              @clear="clear"
            />

            <MonthPicker
              :months="availableMonths"
              :loading="monthIndexLoading"
              :error="monthIndexError"
              :selected-month="selectedMonth"
              :selecting="loadingMonthKey"
              @open="openMonthPicker"
              @select="selectMonth"
              @retry="openMonthPicker"
            />


            <div
              ref="sourceMenu"
              class="header-links"
            >
              <button
                type="button"
                class="github-menu-trigger"
                aria-label="打开 GitHub 项目菜单"
                aria-haspopup="menu"
                :aria-expanded="sourceMenuOpen"
                title="GitHub 项目"
                @click.stop="sourceMenuOpen = !sourceMenuOpen"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
                  />
                </svg>
              </button>

              <Transition name="github-menu">
                <div
                  v-if="sourceMenuOpen"
                  class="github-menu-popover"
                  role="menu"
                  aria-label="GitHub 项目仓库"
                >
                  <div class="github-menu-heading">
                    <span class="github-menu-heading-title">项目仓库</span>
                    <span class="github-menu-heading-note">GITHUB</span>
                  </div>

                  <a
                    href="https://github.com/chendada00/bing-wallpaper"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="github-menu-item"
                    role="menuitem"
                    @click="sourceMenuOpen = false"
                  >
                    <span class="github-menu-item-mark">W</span>
                    <span class="github-menu-item-copy">
                      <strong>bing-wallpaper</strong>
                      <small>网站前端与页面交互</small>
                    </span>
                    <span class="github-menu-arrow" aria-hidden="true">↗</span>
                  </a>

                  <a
                    href="https://bing-data.xn--xpqp35o.cn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="github-menu-item"
                    role="menuitem"
                    @click="sourceMenuOpen = false"
                  >
                    <span class="github-menu-item-mark">D</span>
                    <span class="github-menu-item-copy">
                      <strong>bing-data</strong>
                      <small>历史数据与处理脚本</small>
                    </span>
                    <span class="github-menu-arrow" aria-hidden="true">↗</span>
                  </a>

                  <a
                    href="https://bing-uhd.xn--xpqp35o.cn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="github-menu-item"
                    role="menuitem"
                    @click="sourceMenuOpen = false"
                  >
                    <span class="github-menu-item-mark">U</span>
                    <span class="github-menu-item-copy">
                      <strong>bing-uhd</strong>
                      <small>高清壁纸原图</small>
                    </span>
                    <span class="github-menu-arrow" aria-hidden="true">↗</span>
                  </a>
                </div>
              </Transition>
            </div>


          </div>


        </div>


      </header>





      <main
        class="main-content"
        :class="{ 'month-filter-active': selectedMonth }"
      >

        <!-- 当前月份悬浮面板 -->
        <Transition name="month-float">
          <section
            v-if="selectedMonth"
            class="month-view-heading"
            aria-label="当前月份筛选状态"
          >
            <div class="month-view-copy">
              <span class="month-view-eyebrow">
                WALLPAPER ARCHIVE
              </span>

              <h2>
                {{ Number(selectedMonth.slice(0, 4)) }}年
                {{ Number(selectedMonth.slice(5, 7)) }}月
              </h2>

              <p>
                {{ monthViewItems.length }} 张壁纸
              </p>
            </div>

            <button
              type="button"
              class="month-home-button"
              @click="returnToHome"
            >
              <span aria-hidden="true">↶</span>
              返回主页
            </button>
          </section>
        </Transition>




        <section
          v-if="heroItem && !selectedMonth"
          class="hero-section"
        >
          <div class="hero-image">

            <!-- 图片单独缩放，文字不受影响 -->
            <img
              class="hero-photo"
              :src="heroItem.preview || heroItem.base64"
              :alt="heroItem.title || '伴随·光影精选壁纸'"
              loading="eager"
              decoding="async"
            />

            <!-- 图片上的轻柔渐变 -->
            <div class="hero-shade" />

            <!-- 左上角：品牌名称与副标题 -->
            <div class="hero-brand">
             

              <div class="hero-brand-text">
                <h1>伴随·光影</h1>
                <p>每日一景，长久珍藏。</p>
              </div>
            </div>

            <!-- 右上角：操作与精选标签 -->
            <div class="hero-top">
              <span class="hero-label">随机精选</span>

              <button
                type="button"
                class="hero-refresh"
                @click="pickRandomHero"
              >
                换一张 ↻
              </button>
            </div>

            <!-- 底部：壁纸信息 -->
            <div class="hero-content">
              <time :datetime="heroItem.date">
                {{ heroItem.date }}
              </time>

              <h2>
                {{ heroItem.title || 'Bing Wallpaper' }}
              </h2>

              <p>
                {{ heroItem.description || heroItem.copyright || '' }}
              </p>

              <small v-if="heroItem.copyright">
                {{ heroItem.copyright }}
              </small>

              <button
                type="button"
                class="hero-view-button"
                @click="openWallpaperModal(heroItem)"
              >
                查看壁纸 ↗
              </button>
            </div>

          </div>
        </section>



        <section
          v-if="displayResult.length > 0"
          class="wallpaper-grid"
        >
          <WallpaperCard
            v-for="item in displayResult"

            :key="item.date"

            :item="item"

            :should-load="imageLoadQueue.has(item.date)"

            :load-state="imageStates[item.date]?.state || 'idle'"

            :retry-key="imageStates[item.date]?.retryKey || 0"

            :is-latest="!searching && item.date === latestWallpaperDate"

            @click="openWallpaperModal(item)"

            @mouseenter="setBackground"

            @image-loaded="handleImageLoaded"

            @image-error="handleImageError"

            @retry-image="retryImage"

          />


        </section>

        <div
          v-if="scope==='all' && historyTotal>historyVisibleCount"
          class="history-result-more"
        >
          <button
            type="button"
            @click="loadMoreHistoryResults(); nextTick(fillImageLoadQueue)"
          >
            加载更多搜索结果
            <span>{{historyVisibleCount}} / {{historyTotal}}</span>
          </button>
        </div>


        <LoadingState
          v-if="initialLoading || loading"
        />




        <div
          v-if="error"
          class="error-state"
          role="alert"
        >
          <div class="error-state-icon" aria-hidden="true">
            !
          </div>

          <div class="error-state-content">
            <strong class="error-state-title">
              壁纸数据加载失败
            </strong>

            <p class="error-state-message">
              {{ error }}
            </p>
          </div>

          <button
            type="button"
            class="error-retry-button"
            :disabled="loading"
            @click="retryData"
          >
            <span
              class="error-retry-icon"
              :class="{ spinning: loading }"
              aria-hidden="true"
            >
              ↻
            </span>
            {{ loading ? '正在重试…' : '重新加载' }}
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

      <SiteFooter/>


      <Timeline
        v-if="!viewerVisible && !selectedMonth"
        :items="items"
        :active-month="activeMonth"
        :visible="timelineVisible"
        :progress="scrollProgress"
        :at-top="atTop"
        :at-bottom="atBottom"
        @select="scrollToMonth"
        @top="scrollToTop"
        @bottom="scrollToBottom"
        @mouseenter="keepTimelineVisible"
        @mouseleave="allowTimelineFade"
      />


      <ImageViewer
        :visible="viewerVisible"
        :item="currentItem"
        :items="displayResult"
        @close="closeWallpaperModal"
        @change="changeViewer"
      />
        
    
    <NotificationToast />

  </div>
</template>


<script setup>

import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  nextTick,
  watch
} from 'vue'

import WallpaperCard from './components/WallpaperCard.vue'
import ImageViewer from './components/ImageViewer.vue'
import LoadingState from './components/LoadingState.vue'
import EndState from './components/EndState.vue'
import SearchPanel from './components/SearchPanel.vue'
import Timeline from './components/Timeline.vue'
import NotificationToast from './components/NotificationToast.vue'
import MonthPicker from './components/MonthPicker.vue'

import { setHomeSeo } from './utils/seo'

import SiteFooter from './components/SiteFooter.vue'

import {
  useBingData
} from './composables/useBingData'


import {
  useWallpaperSearch
} from './composables/useWallpaperSearch'

import {
  useHistoryIndex
} from './composables/useHistoryIndex'

const {
  items,
  loading,
  initialLoading,
  error,
  noMore,
  loadInitial,
  loadNextMonth,
  loadDates,
  retry,
  dataBaseUrl
}=useBingData()


const historySearchItems=ref([])

const {
  keyword,
  date,
  color,
  scope,
  result,
  searching,
  historyTotal,
  historyVisibleCount,
  loadMoreHistoryResults,
  clear
}=useWallpaperSearch(items,historySearchItems)

const historyIndex=useHistoryIndex(dataBaseUrl)


// ================================
// 按月份筛选
// ================================

// 当前选中的月份，格式 YYYY-MM。
// 空字符串表示正常首页。
const selectedMonth = ref('')

// 当前月份对应的壁纸数据。
const monthViewItems = ref([])

// 正在读取历史索引。
const monthIndexLoading = ref(false)

// 正在读取所选月份的数据。
const monthDataLoading = ref(false)

// 历史索引读取错误。
const monthIndexError = ref('')

const loadingMonthKey = ref('')

// 已经读取过的月份选项不需要重复生成。
const availableMonths = computed(() => {
  const rows = historyIndex.index.value?.items || []
  const counts = new Map()

  for (const row of rows) {
    const date = String(row?.[0] || '')

    // 只接受 YYYY-MM-DD 格式。
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      continue
    }

    const key = date.slice(0, 7)

    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([key, count]) => ({
      key,
      year: Number(key.slice(0, 4)),
      month: Number(key.slice(5, 7)),
      count
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
})

// 月份模式下展示专属数据；正常首页仍然使用原来的搜索结果。
const displayResult = computed(() => {
  return selectedMonth.value
    ? monthViewItems.value
    : result.value
})

// 打开弹窗时，首次读取历史索引。
async function openMonthPicker() {
  if (
    monthIndexLoading.value ||
    historyIndex.index.value
  ) {
    return
  }

  monthIndexLoading.value = true
  monthIndexError.value = ''

  try {
    await historyIndex.load()
  } catch (err) {
    console.error('读取月份索引失败:', err)

    monthIndexError.value =
      '历史月份读取失败，请检查网络后重试。'
  } finally {
    monthIndexLoading.value = false
  }
}

// 用户点击某个月份。
async function selectMonth(month) {
  if (!month?.key || monthDataLoading.value) {
    return
  }

  const key = month.key

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) {
    return
  }

  // 必须使用完整索引里的日期，而不是自行推算该月的日期。
  const rows = historyIndex.index.value?.items || []

  const dates = rows
    .filter(row => String(row?.[0] || '').startsWith(key))
    .map(row => String(row[0]))

  if (!dates.length) {
    monthIndexError.value = '该月份没有可用的壁纸数据。'
    return
  }

  monthDataLoading.value = true
  loadingMonthKey.value = key
  monthIndexError.value = ''

  try {
    // loadDates 会复用 useBingData 的月份缓存和请求去重机制。
    const loaded = await loadDates(dates)

    const filtered = loaded
      .filter(item => item.date?.startsWith(key))
      .sort((a, b) => b.date.localeCompare(a.date))

    if (!filtered.length) {
      monthIndexError.value =
        '该月份暂时没有成功加载的壁纸，请稍后重试。'
      return
    }

    // 清理旧搜索条件，避免月份视图与搜索条件产生冲突。
    clear()
    historySearchItems.value = []

    // 切换到月份视图。
    monthViewItems.value = filtered
    selectedMonth.value = key

    // 每次切换展示集合时重新分配图片加载任务。
    resetHomeImageLoadState()

    await nextTick()

    fillImageLoadQueue()
    updateScrollState()

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  } catch (err) {
    console.error('加载月份壁纸失败:', err)

    monthIndexError.value =
      '月份壁纸加载失败，请检查网络后重试。'
  } finally {
    monthDataLoading.value = false
    loadingMonthKey.value = ''
  }
}

// 返回正常首页。
async function returnToHome() {
  selectedMonth.value = ''
  monthViewItems.value = []
  monthIndexError.value = ''

  // 避免之前月份的数据继续占据图片加载队列。
  resetHomeImageLoadState()

  await nextTick()

  fillImageLoadQueue()
  updateScrollState()

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}


const WALLPAPER_HASH_RE = /^#(\d{4}-\d{2}-\d{2})$/

function getWallpaperDateFromHash() {
  const match = window.location.hash.match(WALLPAPER_HASH_RE)
  if (!match) return null

  const date = match[1]
  const parsed = new Date(`${date}T00:00:00Z`)

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return null
  }

  return date
}

// 通过日期恢复壁纸：先查内存数据，再复用 useBingData 的历史日期加载能力。
async function findWallpaperByDate(date) {
  const inMemoryItems = [
    ...items.value,
    ...monthViewItems.value,
    ...historySearchItems.value,
  ]

  const existing = inMemoryItems.find(item => item?.date === date)
  if (existing) return existing

  try {
    const loaded = await loadDates([date])
    return loaded.find(item => item?.date === date) || null
  } catch (error) {
    console.error(`加载 ${date} 的壁纸失败：`, error)
    return null
  }
}

// 首页卡片和 Hero 入口统一使用此函数打开弹窗并同步 URL。
function openWallpaperModal(item) {
  if (!item?.date) return

  const nextHash = `#${item.date}`
  const currentDate = getWallpaperDateFromHash()

  if (currentDate === item.date) {
    openViewer(item)
    return
  }

  // 从首页打开时新增一条历史记录；如果已经处于另一张弹窗状态，则更新当前记录。
  if (currentDate) {
    window.history.replaceState(
      {
        ...(window.history.state || {}),
        wallpaperModal: window.history.state?.wallpaperModal === true,
        wallpaperDate: item.date,
      },
      '',
      `${window.location.pathname}${window.location.search}${nextHash}`,
    )
  } else {
    window.history.pushState(
      {
        ...(window.history.state || {}),
        wallpaperModal: true,
        wallpaperDate: item.date,
      },
      '',
      `${window.location.pathname}${window.location.search}${nextHash}`,
    )
  }

  openViewer(item)
}

let hashOpenRequestId = 0

async function openWallpaperFromHash(date) {
  const requestId = ++hashOpenRequestId
  const item = await findWallpaperByDate(date)

  // 如果异步加载期间 URL 已经改变，不要打开过期的图片。
  if (
    requestId !== hashOpenRequestId ||
    getWallpaperDateFromHash() !== date
  ) {
    return
  }

  if (!item) {
    closeViewer()
    return
  }

  openViewer(item)
}

function handleWallpaperHistoryChange() {
  const date = getWallpaperDateFromHash()

  if (!date) {
    hashOpenRequestId++
    closeViewer()
    return
  }

  // 避免相同日期在 浏览器历史变化 中被重复加载。
  if (viewerVisible.value && currentItem.value?.date === date) {
    return
  }

  void openWallpaperFromHash(date)
}

function closeWallpaperModal() {
  if (getWallpaperDateFromHash()) {
    if (window.history.state?.wallpaperModal === true) {
      // 卡片打开的弹窗：回到之前的首页历史记录，由 popstate 负责关闭弹窗。
      window.history.back()
      return
    }

    // 直接访问分享链接：关闭弹窗但留在本站，不返回外部网站。
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    )
  }

  closeViewer()
}

const viewerVisible=ref(false)

const currentItem=ref(null)

const heroItem = ref(null)

const backgroundLayers = ref([
  null,
  null
])

const backgroundIndex = ref(0)


const loadMoreTrigger=ref(null)

const timelineVisible=ref(false)
const activeMonth=ref('')
const scrollProgress=ref(0)
const atTop=ref(true)
const atBottom=ref(false)

let timelineHideTimer=null
let scrollUpdateFrame=null
let timelineMouseInside=false
// 时间轴主动跳转目标
let timelineTargetMonth = null
// 时间轴主动跳转期间，暂时不根据滚动位置修改月份
let timelineScrolling=false

let observer=null




const sourceMenu = ref(null)
const sourceMenuOpen = ref(false)

function handleSourceMenuOutsideClick(event) {
  const menu = sourceMenu.value

  if (menu && !menu.contains(event.target)) {
    sourceMenuOpen.value = false
  }
}

function handleSourceMenuEscape(event) {
  if (event.key === 'Escape') {
    sourceMenuOpen.value = false
  }
}



/**
 * 同时加载图片数量
 */
const IMAGE_CONCURRENCY=9



const imageLoadQueue=ref(new Set())


// idle loading loaded error
const imageStates=ref({})


const startedImages=new Set()


const loadingImages=new Set()

const latestWallpaperDate = computed(() => {
  if (!items.value.length) {
    return ''
  }

  return items.value.reduce((latest, item) => {
    return item.date > latest ? item.date : latest
  }, '')
})



function pickRandomHero() {
  const candidates = items.value.filter(item =>
    item?.date &&
    (item.preview || item.base64)
  )

  if (!candidates.length) {
    heroItem.value = null
    return
  }

  // 尽量避免连续两次展示同一张图片
  const alternatives = candidates.filter(
    item => item.date !== heroItem.value?.date
  )

  const pool = alternatives.length
    ? alternatives
    : candidates

  const index = Math.floor(Math.random() * pool.length)

  heroItem.value = pool[index]
}



function getImageState(date){

  return (
    imageStates.value[date]?.state ||
    'idle'
  )

}

function setImageState(
  date,
  state
){

  imageStates.value={

    ...imageStates.value,

    [date]:{

      ...(imageStates.value[date]||{}),

      state

    }

  }

}



/**
 * 根据当前搜索状态决定加载哪些图片
 */
function getDisplayItems() {
  return displayResult.value
}



/**
 * 图片加载队列
 */
function fillImageLoadQueue() {
  const source = getDisplayItems()

  while (
    loadingImages.size <
    IMAGE_CONCURRENCY
  ) {
    const nextItem = source.find(item => {
      return (
        item?.date &&
        !startedImages.has(item.date) &&
        getImageState(item.date) !== 'loaded'
      )
    })

    if (!nextItem) {
      break
    }

    const date = nextItem.date

    // 标记：已经进入过加载流程
    startedImages.add(date)

    // 标记：当前正在加载
    loadingImages.add(date)

    // 更新状态
    setImageState(
      date,
      'loading'
    )

    // 注意：
    // 这里加入以后不要删除。
    // 它同时代表“该图片已经获得加载资格”。
    imageLoadQueue.value = new Set([
      ...imageLoadQueue.value,
      date
    ])
  }
}



function handleImageLoaded(date){


  loadingImages.delete(date)


  setImageState(
    date,
    'loaded'
  )


  fillImageLoadQueue()


}



function handleImageError(date){


  loadingImages.delete(date)


  setImageState(
    date,
    'error'
  )


  fillImageLoadQueue()


}




function retryImage(date){


  if(!date){

    return

  }



  startedImages.delete(date)



  imageStates.value={

    ...imageStates.value,

    [date]:{

      ...(imageStates.value[date]||{}),

      state:'idle',

      retryKey:
        (
          imageStates.value[date]
          ?.retryKey || 0
        ) + 1

    }

  }



  fillImageLoadQueue()


}



/**
 * 重试壁纸 JSON 加载。
 *
 * 不能只依赖 watch([result, items])：
 * items 可能是原地修改的数组，引用没有变化。
 * 请求结束后主动补充图片队列，确保新卡片开始加载。
 */
async function retryData() {
  try {
    await retry()
  } finally {
    await nextTick()

    fillImageLoadQueue()
    updateScrollState()
  }
}


// 搜索结果是 computed。原逻辑只在初次加载/图片完成后填队列，
// 搜索条件变化时没有重新触发，因此新出现的结果可能永久停留在 idle。
watch(
  [result, items, monthViewItems],
  async ()=>{
    await nextTick()
    fillImageLoadQueue()
  },
  {flush:'post'}
)

let historySearchRequestId=0

watch(
  [scope,keyword,date],
  async()=>{
    const requestId=++historySearchRequestId

    if(scope.value!=='all'){
      historySearchItems.value=[]
      await nextTick()
      fillImageLoadQueue()
      updateScrollState()
      return
    }

    historySearchItems.value=[]

    if(!keyword.value && !date.value){
      await nextTick()
      fillImageLoadQueue()
      updateScrollState()
      return
    }

    try{
      await historyIndex.load()

      const dates=historyIndex.search(
        keyword.value,
        date.value
      )

      if(requestId!==historySearchRequestId){
        return
      }

      // 为避免一个非常宽泛的关键词一次拉取几百个月 JSON，
      // 单次最多加载最近 180 个命中日期。
      // 索引本身仍然可以告诉用户总命中量。
      const datesToLoad=dates.slice(0,180)

      const loaded=await loadDates(datesToLoad)

      if(requestId!==historySearchRequestId){
        return
      }

      const dateSet=new Set(datesToLoad)

      historySearchItems.value=loaded
        .filter(item=>dateSet.has(item.date))
        .sort((a,b)=>b.date.localeCompare(a.date))

      await nextTick()
      fillImageLoadQueue()
      updateScrollState()
    }catch(error){
      if(requestId===historySearchRequestId){
        console.error('全历史搜索失败:',error)
      }
    }
  },
  {flush:'post'}
)


function openViewer(item){
  currentItem.value=item
  viewerVisible.value=true
  timelineVisible.value=false
  if(timelineHideTimer){
    clearTimeout(timelineHideTimer)
    timelineHideTimer=null
  }
  document.body.style.overflow='hidden'
}


function setBackground(item) {

  if (!item?.base64) {
    return
  }


  /*
   * 背景改变时同步更新首页品牌颜色。
   */
  updateIntroTheme(item)


  const current =
    backgroundLayers.value[
      backgroundIndex.value
    ]


  if (
    current?.date === item.date
  ) {
    return
  }


  const nextIndex =
    backgroundIndex.value === 0
      ? 1
      : 0


  backgroundLayers.value = [

    ...backgroundLayers.value.slice(
      0,
      nextIndex
    ),

    item,

    ...backgroundLayers.value.slice(
      nextIndex + 1
    )

  ]


  backgroundIndex.value =
    nextIndex
}


function closeViewer(){
  viewerVisible.value=false
  currentItem.value=null
  document.body.style.overflow=''
  updateScrollState()
  showTimeline()
}



function changeViewer(item) {
  if (!item?.date) return

  currentItem.value = item

  const nextHash = `#${item.date}`
  if (window.location.hash === nextHash) return

  // 左右切换只更新当前历史记录：地址随图片变化，但后退仍可关闭整个弹窗。
  window.history.replaceState(
    {
      ...(window.history.state || {}),
      wallpaperDate: item.date,
    },
    '',
    `${window.location.pathname}${window.location.search}${nextHash}`,
  )
}




function showTimeline(){
  if(viewerVisible.value){
    return
  }
  timelineVisible.value=true
  if(timelineHideTimer){
    clearTimeout(timelineHideTimer)
  }
  if(!timelineMouseInside){
    timelineHideTimer=setTimeout(()=>{
      if(!timelineMouseInside && !viewerVisible.value){
        timelineVisible.value=false
      }
    },3000)
  }
}

function keepTimelineVisible(){
  timelineMouseInside=true
  if(timelineHideTimer){
    clearTimeout(timelineHideTimer)
    timelineHideTimer=null
  }
  timelineVisible.value=true
}

function allowTimelineFade(){
  timelineMouseInside=false
  showTimeline()
}

function scrollToMonth(month){

  if(!month?.firstDate){
    return
  }

  const target=document.getElementById(
    `wallpaper-${month.firstDate}`
  )

  if(!target){
    return
  }

  /*
   * 记录用户点击的目标月份
   */
  timelineTargetMonth=month.key

  /*
   * 立即激活。
   */
  activeMonth.value=month.key

  /*
   * 告诉滚动监听：
   * 现在是时间轴主动导航，不要抢着修改 activeMonth。
   */
  timelineScrolling=true

  showTimeline()

  /*
   * 不再使用 scrollIntoView。
   *
   * 因为 scrollIntoView 会把元素直接顶到 viewport 顶部，
   * 和你后面的 headerOffset=110 判断存在偏差。
   *
   * 改成自己计算最终 scrollTop。
   */
  const rect=target.getBoundingClientRect()

  const currentScrollTop=
    window.scrollY ||
    window.pageYOffset ||
    0

  /*
   * 你的 header 高度大约为 80~100px，
   * 这里使用和 updateActiveMonth 一致的 110px。
   */
  const headerOffset=110

  const targetTop=
    currentScrollTop +
    rect.top -
    headerOffset

  window.scrollTo({
    top:Math.max(0,targetTop),
    behavior:'smooth'
  })

  /*
   * 等平滑滚动结束。
   *
   * 这里不是简单地立即 updateActiveMonth，
   * 而是先确认页面已经接近目标位置。
   */
  waitForTimelineScrollEnd(
    month.key,
    target
  )
}

function waitForTimelineScrollEnd(
  monthKey,
  target
){

  let lastScrollY=
    window.scrollY ||
    window.pageYOffset ||
    0

  let stableFrames=0

  const check=()=>{

    const currentScrollY=
      window.scrollY ||
      window.pageYOffset ||
      0

    /*
     * 页面还在滚动
     */
    if(Math.abs(currentScrollY-lastScrollY)>0.5){

      lastScrollY=currentScrollY

      stableFrames=0

      requestAnimationFrame(check)

      return
    }

    /*
     * 连续多个 frame 没有明显变化，
     * 认为 smooth scroll 已经结束。
     */
    stableFrames++

    if(stableFrames<6){

      requestAnimationFrame(check)

      return
    }

    /*
     * 滚动完成。
     */
    timelineScrolling=false

    /*
     * 最终强制使用用户点击的月份。
     */
    activeMonth.value=monthKey

    timelineTargetMonth=null

    /*
     * 更新顶部/底部状态，
     * 但这里不要再让 updateActiveMonth()
     * 覆盖刚刚确定的月份。
     */
    updateScrollPositionOnly()

  }

  requestAnimationFrame(check)
}

function updateScrollPositionOnly(){

  const doc=document.documentElement

  const scrollTop=
    window.scrollY ||
    window.pageYOffset ||
    0

  const maxScroll=
    Math.max(
      0,
      doc.scrollHeight-window.innerHeight
    )

  scrollProgress.value=
    maxScroll===0
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            (scrollTop/maxScroll)*100
          )
        )

  atTop.value=
    scrollTop<=8

  atBottom.value=
    scrollTop>=maxScroll-8
}

function scrollToTop(){
  window.scrollTo({top:0,behavior:'smooth'})
  showTimeline()
}

function scrollToBottom(){
  window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'})
  showTimeline()
}

function updateActiveMonth(){

  if(viewerVisible.value){
    return
  }

  /*
   * 如果是时间轴主动跳转，
   * 不允许普通滚动检测覆盖用户点击的月份。
   */
  if(timelineScrolling){

    if(timelineTargetMonth){

      activeMonth.value=timelineTargetMonth

    }

    return
  }

  const cards=Array.from(
    document.querySelectorAll('.wallpaper-card')
  )

  if(!cards.length){
    return
  }

  /*
   * 使用距离顶部最近的卡片作为当前卡片。
   *
   * 不再使用“最后一个 top <= 110px”的方式，
   * 避免点击月份后出现临界位置判断错误。
   */
  const headerOffset=110

  let currentCard=cards[0]

  let bestDistance=Infinity

  for(const card of cards){

    const rect=card.getBoundingClientRect()

    const distance=Math.abs(
      rect.top-headerOffset
    )

    if(distance<bestDistance){

      bestDistance=distance

      currentCard=card

    }
  }

  const date=currentCard.id.replace(
    'wallpaper-',
    ''
  )

  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
    return
  }

  activeMonth.value=date.slice(0,7)
}

function updateScrollState(){
  const doc=document.documentElement
  const scrollTop=window.scrollY||window.pageYOffset||0
  const maxScroll=Math.max(0,doc.scrollHeight-window.innerHeight)
  scrollProgress.value=maxScroll===0?0:Math.min(100,Math.max(0,(scrollTop/maxScroll)*100))
  atTop.value=scrollTop<=8
  atBottom.value=scrollTop>=maxScroll-8
  updateActiveMonth()
}

function handleWindowScroll(){
  showTimeline()
  if(scrollUpdateFrame!==null){
    return
  }
  scrollUpdateFrame=requestAnimationFrame(()=>{
    updateScrollState()
    scrollUpdateFrame=null
  })
}

let mouseMoveFrame = null
let mouseEnergyTimer = null
function handleMouseMove(event){


  showTimeline()

  if (mouseMoveFrame !== null) {
    return
  }

  mouseMoveFrame = requestAnimationFrame(() => {
    const x =
      (
        event.clientX /
        window.innerWidth -
        0.5
      ) * 2

    const y =
      (
        event.clientY /
        window.innerHeight -
        0.5
      ) * 2

    document.documentElement.style.setProperty(
      '--mouse-x',
      x.toFixed(3)
    )

    document.documentElement.style.setProperty(
      '--mouse-y',
      y.toFixed(3)
    )

    document.documentElement.style.setProperty(
      '--mouse-energy',
      '1'
    )

    if (mouseEnergyTimer !== null) {
      clearTimeout(mouseEnergyTimer)
    }

    mouseEnergyTimer = setTimeout(() => {
      document.documentElement.style.setProperty(
        '--mouse-energy',
        '0'
      )

      mouseEnergyTimer = null
    }, 260)

    mouseMoveFrame = null
  })
}


async function handleLoadMore(entries) {
  if (selectedMonth.value) {
    return
  }

  if (!entries[0]?.isIntersecting) {
    return
  }

  if (searching.value) {
    return
  }

  if (
    loading.value ||
    initialLoading.value ||
    noMore.value
  ) {
    return
  }

  const addedItems =
    await loadNextMonth()

  if (addedItems.length > 0) {
    await nextTick()

    fillImageLoadQueue()
  }
}

function resetHomeImageLoadState() {
  loadingImages.clear()

  imageLoadQueue.value = new Set()

  startedImages.clear()

  imageStates.value = {}
}

onMounted(async () => {
  window.addEventListener('popstate', handleWallpaperHistoryChange)
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  window.addEventListener('mousemove', handleMouseMove, { passive: true })

  document.addEventListener('click', handleSourceMenuOutsideClick)
  document.addEventListener('keydown', handleSourceMenuEscape)

  // 首页只初始化一次；带日期的分享链接在首页数据准备好后恢复弹窗。
  await initializeHome()

  const date = getWallpaperDateFromHash()
  if (date) {
    await openWallpaperFromHash(date)
  }
})

async function initializeHome() {
  setHomeSeo()

  resetHomeImageLoadState()

  await loadInitial()

  await nextTick()

  if (!heroItem.value && items.value.length > 0) {
    pickRandomHero()
  }

  if (
    items.value.length > 0 &&
    items.value[0]?.base64
  ) {
    setBackground(items.value[0])
  }

  fillImageLoadQueue()

  updateScrollState()

  if (!observer && loadMoreTrigger.value) {
    observer = new IntersectionObserver(
      handleLoadMore,
      {
        rootMargin: '800px 0px'
      }
    )

    observer.observe(loadMoreTrigger.value)
  }
}



onBeforeUnmount(()=>{
  window.removeEventListener('popstate', handleWallpaperHistoryChange)


  document.removeEventListener(
    'click',
    handleSourceMenuOutsideClick
  )

  document.removeEventListener(
    'keydown',
    handleSourceMenuEscape
  )


  if(observer){
    observer.disconnect()
  }
  window.removeEventListener('scroll',handleWindowScroll)
  window.removeEventListener('mousemove',handleMouseMove)
  if(timelineHideTimer){
    clearTimeout(timelineHideTimer)
  }
  if(scrollUpdateFrame!==null){
    cancelAnimationFrame(scrollUpdateFrame)
  }
  if(mouseMoveFrame !== null){
    cancelAnimationFrame(mouseMoveFrame)
  }
  if (mouseEnergyTimer !== null) {
    clearTimeout(mouseEnergyTimer)
  }
  document.body.style.overflow=''
})


function hexToRgb(value) {

  if (
    typeof value !== 'string'
  ) {
    return null
  }


  const hex =
    value
      .trim()
      .replace('#', '')


  if (
    !/^[0-9a-fA-F]{6}$/.test(hex)
  ) {
    return null
  }


  return {

    r:
      parseInt(
        hex.slice(0,2),
        16
      ),

    g:
      parseInt(
        hex.slice(2,4),
        16
      ),

    b:
      parseInt(
        hex.slice(4,6),
        16
      )

  }

}


function mixHex(
  a,
  b,
  weight = .5
) {

  const first =
    hexToRgb(a)

  const second =
    hexToRgb(b)


  if (
    !first ||
    !second
  ) {
    return b
  }


  const w =
    Math.max(
      0,
      Math.min(
        1,
        weight
      )
    )


  const mix =
    (x,y) =>
      Math.round(
        x + (y-x)*w
      )


  return `rgb(
    ${mix(first.r,second.r)},
    ${mix(first.g,second.g)},
    ${mix(first.b,second.b)}
  )`
}


function updateIntroTheme(item) {

  const rgb =
    hexToRgb(item?.color)


  if (!rgb) {
    return
  }


  const luminance =
    (
      0.2126 * rgb.r +
      0.7152 * rgb.g +
      0.0722 * rgb.b
    ) / 255


  const darkBackground =
    luminance < 0.48


  const titleColor =
    darkBackground

      ? mixHex(
          item.color,
          '#ffffff',
          .72
        )

      : mixHex(
          item.color,
          '#111111',
          .62
        )


  document.documentElement.style.setProperty(
    '--intro-title-color',
    titleColor
  )


  document.documentElement.style.setProperty(
    '--intro-muted-color',

    darkBackground

      ? 'rgba(255,255,255,.62)'

      : 'rgba(25,25,25,.52)'
  )


  document.documentElement.style.setProperty(
    '--intro-shadow',

    darkBackground

      ? '0 3px 26px rgba(0,0,0,.34)'

      : '0 2px 22px rgba(255,255,255,.42)'
  )
}


</script>


<style scoped>

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
}

.header-info {
  flex: 0 0 auto;
  color: #555 !important;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.header-right :deep(.search-box) {
  flex-shrink: 0;
}

/* 中等屏幕：压缩间距，但仍保持单行 */
@media (max-width: 1100px) {
  .header-right {
    gap: 8px;
  }

  .header-info {
    display: none;
  }
}

/* 手机端：品牌一行，操作一行 */
@media (max-width: 700px) {
  .header-inner {
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    justify-content: space-between;
    gap: 8px 0;

    width: calc(100% - 24px);
    height: auto;
    min-height: 58px;
    padding: 9px 0 10px;
  }

  .brand {
    flex: 0 0 100%;
    min-width: 0;
    gap: 8px;
  }

  .brand-icon {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border-radius: 8px;
    font-size: 13px;
  }

  .brand-title {
    font-size: 13px;
    line-height: 1.3;
  }

  .brand-subtitle {
    display: none;
  }

  .header-right {
    display: flex;
    flex: 0 0 100%;
    width: 100%;
    min-width: 0;
    gap: 7px;
    justify-content: space-between;
  }

  .header-info {
    display: none;
  }

  /* 搜索框占用剩余空间，不挤压其他按钮 */
  .header-right :deep(.search-box) {
    flex: 1 1 0;
    width: 0;
    min-width: 0;
    max-width: none;
    height: 35px;
    padding: 0 6px;
    border-radius: 10px;
  }

  .header-right :deep(.search-scope) {
    gap: 1px;
    margin-right: 4px;
  }

  .header-right :deep(.search-scope button) {
    padding-right: 4px;
    padding-left: 4px;
    font-size: 9px;
  }

  .header-right :deep(.search-box input) {
    flex: 1 1 0;
    width: 0;
    min-width: 0;
    font-size: 11px;
  }

  .header-right :deep(.color-btn),
  .header-right :deep(.clear) {
    flex: 0 0 auto;
    min-width: 22px;
  }

  /* 月份按钮保持完整，不允许被压缩 */
  .header-right :deep(.month-picker) {
    flex: 0 0 auto;
  }

  .header-right :deep(.month-trigger) {
    height: 35px;
    gap: 5px;
    padding: 0 8px;
    font-size: 10px;
  }

  /* 历史菜单与源码入口保留可点击面积 */
  .header-right :deep(.history-controls) {
    flex: 0 0 30px;
  }

  .header-right :deep(.history-more-button) {
    width: 30px;
    height: 35px;
  }

  .header-right .header-links {
    flex: 0 0 34px;
  }

  .header-right :deep(.github-menu-trigger) {
    width: 34px;
    height: 35px;
  }
}

/* 超窄屏幕：优先保证按钮可见 */
@media (max-width: 380px) {
  .header-inner {
    width: calc(100% - 20px);
  }

  .header-right {
    gap: 5px;
  }

  .header-right :deep(.search-box) {
    padding-right: 4px;
    padding-left: 4px;
  }

  .header-right :deep(.search-scope button) {
    padding-right: 3px;
    padding-left: 3px;
    font-size: 8px;
  }

  .header-right :deep(.month-trigger) {
    gap: 4px;
    padding: 0 6px;
    font-size: 9px;
  }
}


</style>
