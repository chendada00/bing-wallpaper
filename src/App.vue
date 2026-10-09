<template>
  <div class="app">

    <div
      v-if="!isWallpaperRoute"
      class="ambient-background"
    >

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


    <WallpaperPage
      v-if="isWallpaperRoute"
      :item="routeItem"
      :loading="routeLoading"
      :not-found="routeNotFound"
      @back="goHome"
    />


    <template v-else>

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
              {{ items.length }} wallpapers
            </div>


            <SearchPanel

              v-if="items.length>0"

              v-model:keyword="keyword"

              v-model:date="date"
              v-model:color="color"
              v-model:scope="scope"
              @clear="clear"

            />

            <HistoryControls
              :loading="loadingAllHistory"
              @load-all="startLoadAllHistory"
            />

            <div class="header-links">


              <a
                href="https://github.com/chendada00/bing-wallpaper"
                target="_blank"
                rel="noopener noreferrer"
                title="前端源码"
              >

                <svg
                  viewBox="0 0 24 24"
                >

                  <path
                    d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
                  />

                </svg>

                <span>
                  源码
                </span>

              </a>



              <a
                href="https://bing-data.伴随.cn/"
                target="_blank"
                rel="noopener noreferrer"
                title="壁纸数据"
              >

                <svg
                  viewBox="0 0 24 24"
                >

                  <path
                    d="M3.5 5.5A2.5 2.5 0 0 1 6 3h4.2c.66 0 1.3.26 1.77.73l1.07 1.07c.47.47 1.1.73 1.77.73H18A2.5 2.5 0 0 1 20.5 8v8.5A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-11Z"
                  />

                </svg>


                <span>
                  数据
                </span>


              </a>


            </div>


          </div>


        </div>


      </header>




      <main class="main-content">


        <section
          v-if="heroItem"
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
                @click="openViewer(heroItem)"
              >
                查看壁纸 ↗
              </button>
            </div>

          </div>
        </section>



        <section
          v-if="result.length > 0"
          class="wallpaper-grid"
        >


          <WallpaperCard

            v-for="item in result"

            :key="item.date"

            :item="item"

            :should-load="imageLoadQueue.has(item.date)"

            :load-state="imageStates[item.date]?.state || 'idle'"

            :retry-key="imageStates[item.date]?.retryKey || 0"

            :is-latest="!searching && item.date === latestWallpaperDate"

            @click="openViewer(item)"

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



      <Timeline
        v-if="!viewerVisible"
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
        :items="result"
        @close="closeViewer"
        @change="changeViewer"
        @open-detail="openWallpaperDetail"
      />

    </template>
        
    
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

import HistoryControls from './components/HistoryControls.vue'
import WallpaperCard from './components/WallpaperCard.vue'
import ImageViewer from './components/ImageViewer.vue'
import LoadingState from './components/LoadingState.vue'
import EndState from './components/EndState.vue'
import SearchPanel from './components/SearchPanel.vue'
import Timeline from './components/Timeline.vue'
import WallpaperPage from './components/WallpaperPage.vue'
import NotificationToast from './components/NotificationToast.vue'

import {
  setHomeSeo,
  setWallpaperSeo,
  setNotFoundSeo
} from './utils/seo'

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
  loadAllHistory,
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
// 详情页路由请求编号
// 防止用户返回首页后，旧的异步详情请求又把数据写回来
let routeRequestId = 0

// 时间轴主动跳转目标
let timelineTargetMonth = null
// 时间轴主动跳转期间，暂时不根据滚动位置修改月份
let timelineScrolling=false

let observer=null


const currentPath =
  ref(window.location.pathname)

const routeItem =
  ref(null)

const routeLoading =
  ref(false)

const routeNotFound =
  ref(false)

const isWallpaperRoute =
  computed(() => {
    return /^\/wallpaper\/\d{4}-\d{2}-\d{2}\/?$/
      .test(currentPath.value)
  })


const wallpaperRouteDate =
  computed(() => {

    const match =
      currentPath.value.match(
        /^\/wallpaper\/(\d{4}-\d{2}-\d{2})\/?$/
      )

    return match?.[1] || ''

  })


/**
 * 同时加载图片数量
 */
const IMAGE_CONCURRENCY=6



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

function openWallpaperDetail(item) {

  if (!item?.date) {
    return
  }


  const path =
    `/wallpaper/${item.date}`


  /*
   * 从 Viewer 进入详情时，
   * 先关闭 Viewer。
   */
  viewerVisible.value = false

  currentItem.value = null

  document.body.style.overflow = ''


  /*
   * 不再打开新标签页。
   *
   * 让详情页成为当前 SPA 的
   * 一个历史记录。
   */
  window.history.pushState(
    {
      ...(window.history.state || {}),

      bingWallpaperRoute:
        'detail',

      date:
        item.date
    },

    '',

    path
  )


  currentPath.value =
    path


  loadWallpaperRoute()

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
function getDisplayItems(){

  return searching.value
    ? result.value
    : items.value

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

// 搜索结果是 computed。原逻辑只在初次加载/图片完成后填队列，
// 搜索条件变化时没有重新触发，因此新出现的结果可能永久停留在 idle。
watch(
  [result,items],
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


const loadingAllHistory=ref(false)

async function startLoadAllHistory() {
  if (loadingAllHistory.value) {
    return
  }

  loadingAllHistory.value = true

  try {
    scope.value = 'loaded'

    historySearchItems.value = []

    clear()

    await loadAllHistory(
      async () => {
        await nextTick()

        fillImageLoadQueue()

        updateScrollState()
      }
    )

  } finally {
    loadingAllHistory.value = false
  }
}


async function loadWallpaperRoute() {

  const requestId =
    ++routeRequestId

  const date =
    wallpaperRouteDate.value


  if (!date) {
    return
  }


  routeLoading.value = true

  routeNotFound.value = false

  routeItem.value = null


  try {

    const loaded =
      await loadDates([date])


    /*
     * 用户可能已经通过浏览器
     * 返回手势回到首页。
     *
     * 此时旧请求不能再写回详情数据。
     */
    if (
      requestId !== routeRequestId ||
      !isWallpaperRoute.value
    ) {
      return
    }


    const item =
      loaded.find(
        value =>
          value.date === date
      )


    if (!item) {

      routeNotFound.value = true

      setNotFoundSeo()

      return
    }


    routeItem.value = item

    setWallpaperSeo(item)


  } catch (error) {

    if (
      requestId !== routeRequestId
    ) {
      return
    }


    console.error(
      '加载壁纸详情失败:',
      error
    )


    routeNotFound.value = true

    setNotFoundSeo()


  } finally {

    if (
      requestId === routeRequestId
    ) {

      routeLoading.value = false

    }

  }

}

async function goHome() {

  /*
   * 如果详情页是从首页进入的，
   * 那么直接退回上一条历史。
   */
  if (
    isWallpaperRoute.value &&
    window.history.state?.bingWallpaperRoute === 'detail'
  ) {

    window.history.back()

    return
  }


  /*
   * 如果用户是直接访问：
   *
   * /wallpaper/2026-09-01
   *
   * 此时没有本站首页历史，
   * 就直接 replace 到首页。
   */
  routeRequestId++


  window.history.replaceState(
    {
      ...(window.history.state || {}),

      bingWallpaperRoute:
        'home'
    },

    '',

    '/'
  )


  currentPath.value =
    '/'


  routeItem.value =
    null


  routeNotFound.value =
    false


  routeLoading.value =
    false


  await initializeHome()

}

async function handleRouteChange() {

  currentPath.value =
    window.location.pathname


  if (isWallpaperRoute.value) {

    await loadWallpaperRoute()

    return
  }


  /*
   * 返回首页时让正在进行的详情请求失效。
   */
  routeRequestId++


  routeItem.value =
    null

  routeNotFound.value =
    false

  routeLoading.value =
    false


  await initializeHome()

}

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



function changeViewer(item){


  if(item){

    currentItem.value=item

  }


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

  if (!window.history.state?.bingWallpaperRoute) {
    window.history.replaceState(
      {
        ...(window.history.state || {}),
        bingWallpaperRoute: 'home'
      },
      '',
      window.location.pathname
    )
  }

  window.addEventListener(
    'popstate',
    handleRouteChange
  )

  window.addEventListener(
    'scroll',
    handleWindowScroll,
    { passive: true }
  )

  window.addEventListener(
    'mousemove',
    handleMouseMove,
    { passive: true }
  )

  if (isWallpaperRoute.value) {
    await loadWallpaperRoute()
  } else {
    await initializeHome()
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
  if(observer){
    observer.disconnect()
  }
  window.removeEventListener('scroll',handleWindowScroll)
  window.removeEventListener('mousemove',handleMouseMove)
    window.removeEventListener(
    'popstate',
    handleRouteChange
  )
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
  display:flex;
  align-items:center;
  gap:14px;

}

.header-info {
  color: #555 !important;
  font-size: 12px;
  font-weight: 600;
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
.header-right :deep(.search-box){

  flex-shrink:0;

}



@media(max-width:900px){


  .header-right{

  gap:8px;

  }


  .header-info{

  display:none;

  }


  }



  @media(max-width:640px){


  .header-right{

  flex:1;

  justify-content:flex-end;

  }


  .header-right :deep(.search-box input){

  width:100px;

  }

}



</style>