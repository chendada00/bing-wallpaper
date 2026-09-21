<template>
  <aside
    v-if="months.length > 0"
    class="timeline"
    :class="{
      visible,
      hovering: isHovering
    }"
    aria-label="壁纸时间轴"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="timeline-glow" />

    <div class="timeline-content">
      <button
        v-for="month in months"
        :key="month.key"
        type="button"
        class="timeline-item"
        :class="{
          active: activeMonth === month.key
        }"
        :title="`跳转到 ${month.label}`"
        @click="selectMonth(month)"
      >
        <span class="timeline-label">
          {{ month.label }}
        </span>

        <span class="timeline-node">
          <span class="timeline-node-inner" />
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import {
  computed,
  ref
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
  }
})

const emit = defineEmits([
  'select',
  'mouseenter',
  'mouseleave'
])

const isHovering = ref(false)

/**
 * 根据当前已经加载的壁纸数据生成月份。
 *
 * 注意：
 * 不根据日历计算日期。
 * 每个月的 firstDate 都来自实际存在的壁纸数据。
 *
 * 因为壁纸是倒序排列：
 *
 * 2026-09-21
 * 2026-09-20
 * ...
 * 2026-09-01
 * 2026-08-31
 * ...
 *
 * 所以一个月份出现的第一条数据，
 * 就是这个月份应该定位的位置。
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

function selectMonth(month) {
  emit('select', month)
}

function handleMouseEnter() {
  isHovering.value = true
  emit('mouseenter')
}

function handleMouseLeave() {
  isHovering.value = false
  emit('mouseleave')
}
</script>

<style scoped>
.timeline {
  --timeline-text: rgba(100, 100, 100, 0.72);
  --timeline-text-active: #222;
  --timeline-line: rgba(120, 120, 120, 0.28);
  --timeline-node: rgba(120, 120, 120, 0.55);
  --timeline-active: #222;

  position: fixed;
  top: 50%;
  right: 24px;

  z-index: 80;

  width: 112px;

  transform:
    translateY(-50%)
    translateX(18px);

  opacity: 0;
  pointer-events: none;

  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.timeline.visible {
  opacity: 1;

  transform:
    translateY(-50%)
    translateX(0);

  pointer-events: auto;
}

/*
 * 鼠标悬停时增加一点存在感
 */
.timeline.hovering {
  transform:
    translateY(-50%)
    translateX(-2px);
}

/*
 * 背后的柔光
 */
.timeline-glow {
  position: absolute;

  top: 50%;
  right: -15px;

  width: 80px;
  height: 70%;

  transform: translateY(-50%);

  border-radius: 50%;

  background:
    radial-gradient(
      ellipse,
      rgba(255, 255, 255, 0.55),
      transparent 70%
    );

  filter: blur(20px);

  opacity: 0;

  pointer-events: none;

  transition: opacity 0.4s ease;
}

.timeline.visible .timeline-glow {
  opacity: 1;
}

.timeline-content {
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: stretch;

  max-height: 70vh;

  overflow-y: auto;

  padding: 18px 0;

  scrollbar-width: none;
}

.timeline-content::-webkit-scrollbar {
  display: none;
}

/*
 * 时间轴主线
 */
.timeline-content::before {
  content: '';

  position: absolute;

  top: 22px;
  bottom: 22px;
  right: 8px;

  width: 1px;

  background:
    linear-gradient(
      to bottom,
      transparent,
      var(--timeline-line) 8%,
      var(--timeline-line) 92%,
      transparent
    );
}

/*
 * 月份节点
 */
.timeline-item {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: flex-end;

  width: 100%;

  padding: 7px 0;

  border: 0;

  background: transparent;

  color: var(--timeline-text);

  font-family: inherit;

  cursor: pointer;

  outline: none;

  transition:
    color 0.3s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

/*
 * 月份文字
 */
.timeline-label {
  margin-right: 17px;

  font-size: 13px;
  font-weight: 600;

  letter-spacing: 0.04em;

  opacity: 0.75;

  transform: translateX(4px);

  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    font-size 0.3s ease,
    font-weight 0.3s ease;
}

/*
 * 节点
 */
.timeline-node {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 17px;
  height: 17px;

  flex-shrink: 0;

  border-radius: 50%;
}

/*
 * 外圈
 */
.timeline-node::before {
  content: '';

  position: absolute;

  inset: 3px;

  border: 1px solid var(--timeline-node);

  border-radius: 50%;

  background: rgba(255, 255, 255, 0.6);

  transition:
    inset 0.3s ease,
    border-color 0.3s ease,
    background 0.3s ease;
}

/*
 * 内点
 */
.timeline-node-inner {
  position: relative;

  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: var(--timeline-node);

  transform: scale(0.7);

  transition:
    width 0.3s ease,
    height 0.3s ease,
    transform 0.3s ease,
    background 0.3s ease;
}

/*
 * Hover
 */
.timeline-item:hover {
  color: var(--timeline-text-active);

  transform: translateX(-3px);
}

.timeline-item:hover .timeline-label {
  opacity: 1;
  transform: translateX(0);
}

.timeline-item:hover .timeline-node::before {
  inset: 1px;

  border-color: var(--timeline-active);

  background: rgba(255, 255, 255, 0.85);
}

.timeline-item:hover .timeline-node-inner {
  width: 5px;
  height: 5px;

  background: var(--timeline-active);

  transform: scale(1);
}

/*
 * 当前月份
 */
.timeline-item.active {
  color: var(--timeline-text-active);

  transform: translateX(-5px);
}

.timeline-item.active .timeline-label {
  opacity: 1;

  font-size: 14px;
  font-weight: 700;

  transform: translateX(0);
}

.timeline-item.active .timeline-node::before {
  inset: 0;

  border-color: var(--timeline-active);

  background: rgba(255, 255, 255, 0.9);
}

.timeline-item.active .timeline-node-inner {
  width: 7px;
  height: 7px;

  background: var(--timeline-active);

  transform: scale(1);

  /*
   * 当前月份呼吸动画
   */
  animation: timeline-pulse 2s ease-in-out infinite;
}

@keyframes timeline-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 0
      rgba(80, 80, 80, 0.15);
  }

  50% {
    box-shadow:
      0 0 0 7px
      rgba(80, 80, 80, 0);
  }
}

/*
 * 鼠标悬停整个时间轴
 */
.timeline.hovering .timeline-item {
  padding-top: 8px;
  padding-bottom: 8px;
}

/*
 * 深色环境
 */
@media (prefers-color-scheme: dark) {
  .timeline {
    --timeline-text: rgba(220, 220, 220, 0.65);
    --timeline-text-active: #fff;
    --timeline-line: rgba(255, 255, 255, 0.25);
    --timeline-node: rgba(255, 255, 255, 0.55);
    --timeline-active: #fff;
  }

  .timeline-glow {
    background:
      radial-gradient(
        ellipse,
        rgba(0, 0, 0, 0.45),
        transparent 70%
      );
  }

  .timeline-node::before {
    background: rgba(0, 0, 0, 0.45);
  }

  .timeline-item:hover .timeline-node::before,
  .timeline-item.active .timeline-node::before {
    background: rgba(0, 0, 0, 0.7);
  }
}

/*
 * 屏幕较小时缩小一点
 */
@media (max-width: 1200px) {
  .timeline {
    right: 12px;
    width: 90px;
  }

  .timeline-label {
    font-size: 11px;
  }

  .timeline-item.active .timeline-label {
    font-size: 12px;
  }
}

/*
 * 手机端直接隐藏
 */
@media (max-width: 700px) {
  .timeline {
    display: none;
  }
}
</style>