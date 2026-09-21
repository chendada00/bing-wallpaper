<template>
  <div class="app">

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

            @clear="clear"

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
              href="https://github.com/chendada00/bing-data"
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


      <section class="intro">

        <div>

          <div class="eyebrow">
            A collection of beautiful moments.
          </div>


          <h1>
            伴随·光影
          </h1>


          <p>
            每日一景，长久珍藏。
          </p>


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

          @click="openViewer(item)"

          @image-loaded="handleImageLoaded"

          @image-error="handleImageError"

          @retry-image="retryImage"

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
    />

  </div>
</template>


<script setup>

import {
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'


import WallpaperCard from './components/WallpaperCard.vue'
import ImageViewer from './components/ImageViewer.vue'
import LoadingState from './components/LoadingState.vue'
import EndState from './components/EndState.vue'
import SearchPanel from './components/SearchPanel.vue'
import Timeline from './components/Timeline.vue'


import {
  useBingData
} from './composables/useBingData'


import {
  useWallpaperSearch
} from './composables/useWallpaperSearch'



const {
  items,
  loading,
  initialLoading,
  error,
  noMore,
  loadInitial,
  loadNextMonth,
  retry
}=useBingData()



const {

  keyword,

  date,

  color,

  result,

  searching,

  clear

}=useWallpaperSearch(items)



const viewerVisible=ref(false)

const currentItem=ref(null)

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
let timelineTargetMonth=null

// 时间轴主动跳转期间，暂时不根据滚动位置修改月份
let timelineScrolling=false

let observer=null



/**
 * 同时加载图片数量
 */
const IMAGE_CONCURRENCY=6



const imageLoadQueue=ref(new Set())


// idle loading loaded error
const imageStates=ref({})


const startedImages=new Set()


const loadingImages=new Set()



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
function getDisplayItems(){

  return searching.value
    ? result.value
    : items.value

}



/**
 * 图片加载队列
 */
function fillImageLoadQueue(){


  const source=getDisplayItems()



  while(
    loadingImages.size <
    IMAGE_CONCURRENCY
  ){


    const nextItem=source.find(item=>{


      return (

        item?.date &&

        !startedImages.has(
          item.date
        )

        &&

        getImageState(
          item.date
        )!=='loaded'


      )


    })



    if(!nextItem){

      break

    }



    const date=nextItem.date



    startedImages.add(date)


    loadingImages.add(date)



    setImageState(
      date,
      'loading'
    )



    imageLoadQueue.value=new Set([

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

function handleMouseMove(){
  showTimeline()
}


async function handleLoadMore(entries){


  if(
    !entries[0]?.isIntersecting
  ){

    return

  }



  // 搜索状态禁止继续加载月份
  if(searching.value){

    return

  }



  if(

    loading.value ||

    initialLoading.value ||

    noMore.value

  ){

    return

  }



  await loadNextMonth()



  fillImageLoadQueue()


}




onMounted(async()=>{
  await loadInitial()
  fillImageLoadQueue()
  updateScrollState()
  window.addEventListener('scroll',handleWindowScroll,{passive:true})
  window.addEventListener('mousemove',handleMouseMove,{passive:true})

  if(!loadMoreTrigger.value){
    return
  }

  observer=new IntersectionObserver(
    handleLoadMore,
    {rootMargin:'800px 0px'}
  )
  observer.observe(loadMoreTrigger.value)
})





onBeforeUnmount(()=>{
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
  document.body.style.overflow=''
})


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