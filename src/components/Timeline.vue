<template>
  <aside
    v-if="months.length"
    class="timeline"
    :class="{ visible, hovering: isHovering }"
    aria-label="壁纸时间轴"
    @mouseenter="enterTimeline"
    @mouseleave="leaveTimeline"
  >
    <div class="timeline-shell">

      <!-- 顶部按钮 -->
      <button
        type="button"
        class="timeline-action"
        :class="{ disabled: atTop }"
        :disabled="atTop"
        title="滚动到顶部"
        @click="emit('top')"
      >
        <span class="arrow arrow-up"></span>
      </button>

      <!-- 月份列表 -->
      <div class="timeline-body">
        <div ref="timelineItemsRef" class="timeline-items">

          <button
            v-for="(month, index) in months"
            :key="month.key"
            :data-month="month.key"
            type="button"
            class="timeline-item"
            :class="{
              active: activeMonth === month.key,
              nearby: isNearby(index)
            }"
            :title="`跳转到 ${month.label}`"
            @click="emit('select', month)"
          >
            <span class="timeline-label">
              {{ month.label }}
            </span>

            <span class="timeline-node-area">
              <span class="timeline-node">
                <span class="timeline-node-halo"></span>
                <span class="timeline-node-ring"></span>
                <span class="timeline-node-core"></span>
              </span>
            </span>
          </button>

        </div>
      </div>

      <!-- 底部按钮 -->
      <button
        type="button"
        class="timeline-action"
        :class="{ disabled: atBottom }"
        :disabled="atBottom"
        title="滚动到底部"
        @click="emit('bottom')"
      >
        <span class="arrow arrow-down"></span>
      </button>

    </div>
  </aside>
</template>

<script setup>
import {
  computed,
  nextTick,
  ref,
  watch
} from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },

  activeMonth: {
    type: String,
    default: ''
  },

  visible: {
    type: Boolean,
    default: false
  },

  atTop: {
    type: Boolean,
    default: false
  },

  atBottom: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'select',
  'top',
  'bottom',
  'mouseenter',
  'mouseleave'
])

const isHovering = ref(false)

/*
 * 根据实际壁纸数据生成月份。
 *
 * 数据是新 -> 旧：
 *
 * 2026-09-21
 * 2026-09-20
 * 2026-08-28
 * 2026-08-27
 *
 * 最终：
 *
 * 2026.09 -> 2026-09-21
 * 2026.08 -> 2026-08-28
 *
 * 不人为计算月底日期。
 */
const months = computed(() => {
  const monthMap = new Map()

  for (const item of props.items) {
    const date = String(item?.date || '')

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      continue
    }

    const key = date.slice(0, 7)

    if (!monthMap.has(key)) {
      const [year, month] = key.split('-')

      monthMap.set(key, {
        key,
        label: `${year}.${month}`,
        firstDate: date
      })
    }
  }

  return Array.from(monthMap.values()).sort((a, b) => {
    return b.key.localeCompare(a.key)
  })
})

/*
 * 当前月份附近的节点稍微突出。
 */
function isNearby(index) {
  const currentIndex = months.value.findIndex(
    item => item.key === props.activeMonth
  )

  if (currentIndex === -1) {
    return false
  }

  return Math.abs(currentIndex - index) <= 1
}

const timelineItemsRef=ref(null)

function centerActiveMonth(smooth=true){
  const container=timelineItemsRef.value

  if(!container || !props.activeMonth){
    return
  }

  const target=container.querySelector(
    `.timeline-item[data-month="${props.activeMonth}"]`
  )

  if(!target){
    return
  }

  const targetCenter=
    target.offsetTop + target.offsetHeight / 2

  const nextScrollTop=Math.max(
    0,
    targetCenter - container.clientHeight / 2
  )

  container.scrollTo({
    top:nextScrollTop,
    behavior:smooth ? 'smooth' : 'auto'
  })
}

watch(
  ()=>props.activeMonth,
  async()=>{
    await nextTick()
    centerActiveMonth(true)
  },
  {flush:'post'}
)

watch(
  ()=>months.value.length,
  async()=>{
    await nextTick()
    centerActiveMonth(false)
  },
  {flush:'post'}
)


function enterTimeline() {
  isHovering.value = true
  emit('mouseenter')
}

function leaveTimeline() {
  isHovering.value = false
  emit('mouseleave')
}
</script>

<style scoped>

/* =========================================================
   时间轴整体
   ========================================================= */

.timeline {
  --timeline-text: rgba(45, 45, 45, 0.52);
  --timeline-text-hover: rgba(25, 25, 25, 0.82);
  --timeline-text-active: #151515;

  position: fixed;

  top: 50%;
  right: 22px;

  z-index: 80;

  width: 128px;

  transform:
    translate3d(38px, -50%, 0)
    scale(0.96);

  opacity: 0;

  pointer-events: none;

  transition:
    opacity 0.35s ease,
    transform 0.65s cubic-bezier(0.16, 1.2, 0.35, 1);
}


/* =========================================================
   显示状态
   ========================================================= */

.timeline.visible {
  opacity: 1;

  transform:
    translate3d(0, -50%, 0)
    scale(1);

  pointer-events: auto;
}


/* =========================================================
   鼠标悬停
   ========================================================= */

.timeline.hovering {
  transform:
    translate3d(-3px, -50%, 0)
    scale(1.01);
}


/* =========================================================
   外层玻璃容器
   ========================================================= */

.timeline-shell {
  position: relative;

  display: flex;

  flex-direction: column;

  width: 100%;

  padding: 10px 7px;

  border:
    1px solid
    rgba(255, 255, 255, 0.52);

  border-radius: 18px;

  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.72),
      rgba(255, 255, 255, 0.48)
    );

  backdrop-filter:
    blur(18px)
    saturate(140%);

  -webkit-backdrop-filter:
    blur(18px)
    saturate(140%);

  box-shadow:
    0 10px 36px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);

  overflow: hidden;
}


/* =========================================================
   上下按钮
   ========================================================= */

.timeline-action {
  position: relative;

  display: flex;

  align-items: center;

  justify-content: center;

  width: 100%;

  height: 30px;

  padding: 0;

  border: 0;

  border-radius: 10px;

  background: transparent;

  color: rgba(50, 50, 50, 0.52);

  cursor: pointer;

  transition:
    background 0.25s ease,
    color 0.25s ease,
    transform 0.25s ease,
    opacity 0.25s ease;
}

.timeline-action:hover {
  color: rgba(20, 20, 20, 0.9);

  background:
    rgba(255, 255, 255, 0.42);

  transform: scale(1.04);
}

.timeline-action:active {
  transform: scale(0.94);
}

.timeline-action.disabled {
  opacity: 0.2;

  pointer-events: none;
}


/* =========================================================
   CSS 箭头
   ========================================================= */

.arrow {
  display: block;

  width: 8px;

  height: 8px;

  border-top:
    1.5px solid
    currentColor;

  border-left:
    1.5px solid
    currentColor;
}

.arrow-up {
  transform: rotate(45deg) translate(2px, 2px);
}

.arrow-down {
  transform: rotate(225deg) translate(2px, 2px);
}


/* =========================================================
   时间轴主体
   ========================================================= */

.timeline-body {
  position: relative;

  display: flex;

  width: 100%;

  max-height: 62vh;
}


/* =========================================================
   月份列表
   ========================================================= */

.timeline-items {
  display: flex;

  flex-direction: column;

  width: 100%;

  max-height: 62vh;

  overflow-y: auto;

  scrollbar-width: none;

  overscroll-behavior: contain;
}

.timeline-items::-webkit-scrollbar {
  display: none;
}


/* =========================================================
   月份项目
   ========================================================= */

/*
 * 所有月份高度完全一致。
 *
 * active 不改变 item 高度，
 * 因此不会造成上下月份视觉错位。
 */

.timeline-item {
  display: flex;

  align-items: center;

  justify-content: flex-end;

  width: 100%;

  height: 42px;

  min-height: 42px;

  padding: 0;

  border: 0;

  background: transparent;

  color: var(--timeline-text);

  cursor: pointer;

  transition:
    color 0.25s ease,
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.timeline-item:hover {
  color: var(--timeline-text-hover);

  transform: translateX(-4px);
}

.timeline-item.active {
  color: var(--timeline-text-active);

  transform: translateX(-6px);
}

.timeline-item.active {
  animation: timeline-active-arrive .42s cubic-bezier(.16,1,.3,1);
}

@keyframes timeline-active-arrive {
  0% {
    opacity: .72;
    transform: translateX(-1px) scale(.97);
  }

  60% {
    opacity: 1;
    transform: translateX(-8px) scale(1.015);
  }

  100% {
    opacity: 1;
    transform: translateX(-6px) scale(1);
  }
}


/* =========================================================
   月份文字
   ========================================================= */

.timeline-label {
  display: block;

  min-width: 52px;

  margin-right: 15px;

  text-align: right;

  font-size: 11px;

  line-height: 1;

  font-weight: 500;

  letter-spacing: 0.02em;

  white-space: nowrap;

  opacity: 0.62;

  transform: translateX(2px);

  transition:
    opacity 0.3s ease,
    font-size 0.3s ease,
    font-weight 0.3s ease,
    transform 0.35s ease;
}

.timeline-item:hover .timeline-label {
  opacity: 0.9;

  transform: translateX(0);
}

.timeline-item.active .timeline-label {
  opacity: 1;

  font-size: 13px;

  font-weight: 750;

  transform: translateX(0);
}

.timeline-item.nearby:not(.active) .timeline-label {
  opacity: 0.78;
}


/* =========================================================
   节点固定区域
   ========================================================= */

/*
 * 非常关键：
 *
 * 无论普通节点还是 active 节点，
 * 这里始终固定 26 x 26。
 *
 * 所以 active 放大以后，
 * 不会改变整个列表的布局。
 */

.timeline-node-area {
  position: relative;

  display: flex;

  align-items: center;

  justify-content: center;

  width: 26px;

  height: 26px;

  flex-shrink: 0;
}


/* =========================================================
   节点
   ========================================================= */

.timeline-node {
  position: relative;

  display: flex;

  align-items: center;

  justify-content: center;

  width: 20px;

  height: 20px;

  flex-shrink: 0;
}


/* =========================================================
   当前月份光晕
   ========================================================= */

.timeline-node-halo {
  position: absolute;

  width: 6px;

  height: 6px;

  border-radius: 50%;

  background: transparent;

  box-shadow: none;

  opacity: 0;

  transition:
    width 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.35s ease,
    box-shadow 0.35s ease;
}


/* =========================================================
   节点外圈
   ========================================================= */

.timeline-node-ring {
  position: absolute;

  width: 7px;

  height: 7px;

  border:
    1px solid
    rgba(70, 70, 70, 0.38);

  border-radius: 50%;

  background:
    rgba(255, 255, 255, 0.6);

  transition:
    width 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.3s ease,
    background 0.3s ease,
    box-shadow 0.35s ease;
}


/* =========================================================
   节点中心
   ========================================================= */

.timeline-node-core {
  position: relative;

  width: 3px;

  height: 3px;

  border-radius: 50%;

  background:
    rgba(65, 65, 65, 0.48);

  transition:
    width 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    background 0.3s ease;
}


/* =========================================================
   Hover 节点
   ========================================================= */

.timeline-item:hover .timeline-node-ring {
  width: 10px;

  height: 10px;

  border-color:
    rgba(35, 35, 35, 0.62);

  background:
    rgba(255, 255, 255, 0.78);
}

.timeline-item:hover .timeline-node-core {
  width: 4px;

  height: 4px;

  background:
    rgba(35, 35, 35, 0.72);
}


/* =========================================================
   当前月份
   ========================================================= */

.timeline-item.active .timeline-node-halo {
  width: 24px;

  height: 24px;

  opacity: 1;

  background:
    rgba(40, 40, 40, 0.035);

  box-shadow:
    0 0 0 1px rgba(35, 35, 35, 0.05),
    0 0 18px rgba(35, 35, 35, 0.08);

  animation:
    timeline-halo-pulse
    2.6s
    ease-in-out
    infinite;
}

.timeline-item.active .timeline-node-ring {
  width: 15px;

  height: 15px;

  border:
    1.5px solid
    rgba(25, 25, 25, 0.92);

  background:
    rgba(255, 255, 255, 0.78);

  box-shadow:
    0 0 0 3px rgba(30, 30, 30, 0.035);
}

.timeline-item.active .timeline-node-ring::after {
  content: '';
  position: absolute;
  inset: -5px;
  border: 1px solid rgba(35,35,35,.1);
  border-radius: 50%;
  animation: timeline-ring-wave 2.2s ease-out infinite;
}

@keyframes timeline-ring-wave {
  0% {
    opacity: .7;
    transform: scale(.72);
  }

  100% {
    opacity: 0;
    transform: scale(1.7);
  }
}


.timeline-item.active .timeline-node-core {
  width: 6px;

  height: 6px;

  background:
    rgba(20, 20, 20, 0.95);
}


/* =========================================================
   附近月份
   ========================================================= */

.timeline-item.nearby:not(.active) .timeline-node-ring {
  width: 8px;

  height: 8px;

  border-color:
    rgba(60, 60, 60, 0.46);
}

.timeline-item.nearby:not(.active) .timeline-node-core {
  width: 3px;

  height: 3px;

  background:
    rgba(60, 60, 60, 0.55);
}


/* =========================================================
   当前月份呼吸动画
   ========================================================= */

@keyframes timeline-halo-pulse {
  0%,
  100% {
    transform: scale(0.88);

    opacity: 0.55;
  }

  50% {
    transform: scale(1.08);

    opacity: 1;
  }
}


/* =========================================================
   时间轴出现动画
   ========================================================= */

.timeline.visible .timeline-shell {
  animation:
    timeline-shell-in
    0.55s
    cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes timeline-shell-in {
  from {
    opacity: 0;

    transform:
      translateX(12px)
      scale(0.94);
  }

  to {
    opacity: 1;

    transform:
      translateX(0)
      scale(1);
  }
}


/* =========================================================
   深色模式
   ========================================================= */

@media (prefers-color-scheme: dark) {
  .timeline {
    --timeline-text:
      rgba(235, 235, 235, 0.5);

    --timeline-text-hover:
      rgba(255, 255, 255, 0.86);

    --timeline-text-active:
      #ffffff;
  }

  .timeline-shell {
    border-color:
      rgba(255, 255, 255, 0.12);

    background:
      linear-gradient(
        180deg,
        rgba(30, 30, 30, 0.7),
        rgba(25, 25, 25, 0.5)
      );

    box-shadow:
      0 10px 36px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .timeline-action {
    color:
      rgba(255, 255, 255, 0.48);
  }

  .timeline-action:hover {
    color:
      rgba(255, 255, 255, 0.9);

    background:
      rgba(255, 255, 255, 0.08);
  }

  .timeline-node-ring {
    border-color:
      rgba(220, 220, 220, 0.34);

    background:
      rgba(30, 30, 30, 0.5);
  }

  .timeline-node-core {
    background:
      rgba(230, 230, 230, 0.48);
  }

  .timeline-item:hover .timeline-node-ring {
    border-color:
      rgba(255, 255, 255, 0.65);

    background:
      rgba(40, 40, 40, 0.7);
  }

  .timeline-item.active .timeline-node-halo {
    background:
      rgba(255, 255, 255, 0.045);

    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.06),
      0 0 18px rgba(255, 255, 255, 0.08);
  }

  .timeline-item.active .timeline-node-ring {
    border-color:
      rgba(255, 255, 255, 0.92);

    background:
      rgba(30, 30, 30, 0.7);

    box-shadow:
      0 0 0 3px rgba(255, 255, 255, 0.04);
  }

  .timeline-item.active .timeline-node-core {
    background: #ffffff;
  }
}


/* =========================================================
   中等屏幕
   ========================================================= */

@media (max-width: 1200px) {
  .timeline {
    right: 10px;

    width: 112px;
  }

  .timeline-label {
    margin-right: 12px;
  }
}


/* =========================================================
   手机
   ========================================================= */

@media (max-width: 700px) {
  .timeline {
    display: none;
  }
}

</style>