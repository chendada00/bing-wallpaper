<template>
  <div class="month-picker">
    <!-- 顶部入口按钮 -->
    <button
      type="button"
      class="month-trigger"
      :class="{ active: open || selectedMonth }"
      :disabled="loading"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="openPicker"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3.5"
          y="5"
          width="17"
          height="15.5"
          rx="3"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M7.5 3.5V7M16.5 3.5V7M3.5 9.5H20.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
        <path
          d="M8 13H8.01M12 13H12.01M16 13H16.01M8 16.5H8.01M12 16.5H12.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>

      <span>{{ selectedMonth ? '切换月份' : '按月份' }}</span>
    </button>
    <Teleport to="body">
        <Transition name="month-dialog">
        <div
            v-if="open"
            class="month-backdrop"
            @click="closePicker"
        >
            <section
                class="month-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="month-dialog-title"
                @click.stop
                @keydown.esc="closePicker"
            >
            <header class="month-dialog-header">
                <div class="month-heading">
                <span class="month-eyebrow">WALLPAPER ARCHIVE</span>

                <h2 id="month-dialog-title">
                    探索时光
                </h2>

                <p>选择一个月份，重温那段风景。</p>
                </div>

                <button
                type="button"
                class="month-close"
                aria-label="关闭月份选择"
                @click="closePicker"
                >
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    />
                </svg>
                </button>
            </header>

            <div class="month-summary">
                <span class="summary-dot"></span>
                <span>
                共收录
                <strong>{{ totalWallpapers.toLocaleString() }}</strong>
                张壁纸
                </span>
                <span class="summary-divider"></span>
                <span>{{ months.length }} 个有数据的月份</span>
            </div>

            <div class="month-content">
                <div v-if="loading" class="month-state">
                <span class="month-spinner"></span>
                <p>正在读取历史档案…</p>
                </div>

                <div v-else-if="error" class="month-state">
                <div class="month-state-icon">!</div>
                <p>{{ error }}</p>
                <button type="button" class="month-retry" @click="emit('retry')">
                    重新加载
                </button>
                </div>

                <div v-else-if="!months.length" class="month-state">
                <p>暂时没有可用的历史月份。</p>
                </div>

                <div v-else class="year-list">
                <section
                    v-for="group in groupedMonths"
                    :key="group.year"
                    class="year-group"
                >
                    <div class="year-heading">
                    <h3>{{ group.year }}</h3>
                    <span>{{ group.months.length }} 个月份</span>
                    </div>

                    <div class="month-grid">
                    <button
                        v-for="month in group.months"
                        :key="month.key"
                        type="button"
                        class="month-option"
                        :class="{
                        selected: selectedMonth === month.key,
                        choosing: selecting === month.key
                        }"
                        :disabled="!!selecting"
                        @click="chooseMonth(month)"
                    >
                        <span class="month-number">
                        {{ String(month.month).padStart(2, '0') }}
                        </span>

                        <span class="month-name">
                        {{ month.month }}月
                        </span>

                        <span class="month-count">
                        {{ month.count }} 张
                        </span>

                        <span
                        v-if="selecting === month.key"
                        class="month-option-spinner"
                        ></span>
                    </button>
                    </div>
                </section>
                </div>
            </div>

            <footer class="month-dialog-footer">
                <div class="month-footer-note">
                <span class="footer-sparkle">✳</span>
                每一张壁纸，都是一段时光
                </div>

                <button
                type="button"
                class="month-cancel"
                @click="closePicker"
                >
                关闭
                </button>
            </footer>
            </section>
        </div>
        </Transition>

    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  months: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  selectedMonth: {
    type: String,
    default: ''
  },
  selecting: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['open', 'select', 'retry'])

const open = ref(false)

const groupedMonths = computed(() => {
  const groups = new Map()

  for (const month of props.months) {
    if (!groups.has(month.year)) {
      groups.set(month.year, [])
    }

    groups.get(month.year).push(month)
  }

  return Array.from(groups.entries())
    .map(([year, months]) => ({
      year,
      months: [...months].sort((a, b) => b.month - a.month)
    }))
    .sort((a, b) => b.year - a.year)
})

const totalWallpapers = computed(() =>
  props.months.reduce((sum, month) => sum + month.count, 0)
)

function openPicker() {
  if (props.loading) return

  open.value = true
  emit('open')
}

function closePicker() {
  open.value = false
}

function chooseMonth(month) {
  if (props.selecting) return
  emit('select', month)
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closePicker()
  }
}

watch(open, value => {
  if (value) {
    window.addEventListener('keydown', handleKeydown)
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})


/*
 * 父组件成功加载月份数据后会更新 selectedMonth。
 * 监听这个变化，在数据加载成功后自动关闭弹窗。
 */
watch(
  () => props.selectedMonth,
  (value, oldValue) => {
    if (value && value !== oldValue) {
      closePicker()
    }
  }
)

/*
 * 如果用户重新选择当前已经显示的月份，
 * selectedMonth 不会发生变化。
 * 因此还要在对应月份的加载动画结束后关闭弹窗。
 *
 * 只有加载成功、当前选中月份与本次加载月份一致时才关闭。
 * 加载失败时 selectedMonth 不匹配，弹窗继续显示错误提示。
 */
watch(
  () => props.selecting,
  (value, oldValue) => {
    if (
      oldValue &&
      !value &&
      props.selectedMonth === oldValue
    ) {
      closePicker()
    }
  }
)


onMounted(() => {
  if (open.value) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>

.month-picker {
  flex: 0 0 auto;
}

.month-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 34px;
  padding: 0 11px;
  border: 1px solid rgba(0, 0, 0, .09);
  border-radius: 10px;
  background: rgba(255, 255, 255, .64);
  color: #393939;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, transform .2s ease;
}

.month-trigger svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.month-trigger:hover,
.month-trigger.active {
  background: rgba(255, 255, 255, .96);
  border-color: rgba(0, 0, 0, .17);
}

.month-trigger:active {
  transform: scale(.97);
}

.month-trigger:disabled {
  opacity: .6;
  cursor: wait;
}

/* 全屏遮罩：Teleport 后不再受 sticky header 的定位上下文影响 */
.month-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;

  display: flex;
  align-items: center;
  justify-content: center;

  box-sizing: border-box;
  padding:
    max(12px, env(safe-area-inset-top))
    max(12px, env(safe-area-inset-right))
    max(12px, env(safe-area-inset-bottom))
    max(12px, env(safe-area-inset-left));

  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;

  background: rgba(19, 22, 26, .32);
  backdrop-filter: blur(9px) saturate(120%);
  -webkit-backdrop-filter: blur(9px) saturate(120%);
}

/* 毛玻璃主体 */
.month-dialog {
  display: flex;
  flex-direction: column;

  box-sizing: border-box;
  width: min(480px, 100%);
  max-height: calc(100vh - 24px);
  max-height: calc(
    100dvh
    - max(12px, env(safe-area-inset-top))
    - max(12px, env(safe-area-inset-bottom))
  );
  min-height: 0;
  flex-shrink: 0;
  margin: auto;
  overflow: hidden;

  border: 1px solid rgba(255, 255, 255, .62);
  border-radius: 20px;

  color: #292a27;
  background: rgba(250, 250, 247, .76);

  backdrop-filter: blur(28px) saturate(155%);
  -webkit-backdrop-filter: blur(28px) saturate(155%);

  box-shadow:
    0 24px 80px rgba(0, 0, 0, .20),
    0 2px 10px rgba(0, 0, 0, .05);
}

.month-dialog-header,
.month-summary,
.month-dialog-footer {
  flex-shrink: 0;
}

.month-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 15px;
}

.month-heading {
  min-width: 0;
}

.month-eyebrow {
  display: block;
  margin-bottom: 8px;
  color: #898b82;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.7px;
}

.month-heading h2 {
  margin: 0;
  color: #292a27;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -.6px;
}

.month-heading p {
  margin: 7px 0 0;
  color: #777970;
  font-size: 11px;
  line-height: 1.6;
}

.month-close {
  display: grid;
  flex: 0 0 32px;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, .08);
  border-radius: 10px;
  background: rgba(255, 255, 255, .45);
  color: #55574f;
  cursor: pointer;
}

.month-close svg {
  width: 16px;
  height: 16px;
}

.month-close:hover {
  background: rgba(255, 255, 255, .8);
}

.month-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0 22px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, .65);
  border-radius: 11px;
  background: rgba(255, 255, 255, .34);
  color: #777970;
  font-size: 10px;
}

.month-summary strong {
  color: #33352f;
  font-weight: 700;
}

.summary-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #78876b;
}

.summary-divider {
  width: 1px;
  height: 12px;
  margin: 0 3px;
  background: rgba(0, 0, 0, .12);
}

/* 只有月份列表滚动，标题和底部操作固定 */
.month-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 16px 22px 18px;
}

.year-group + .year-group {
  margin-top: 20px;
}

.year-heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.year-heading h3 {
  margin: 0;
  color: #343630;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -.4px;
}

.year-heading span {
  color: #898b82;
  font-size: 10px;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.month-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;

  box-sizing: border-box;
  min-width: 0;
  min-height: 72px;
  padding: 9px 10px;

  border: 1px solid rgba(70, 75, 60, .10);
  border-radius: 11px;
  background: rgba(255, 255, 255, .43);
  color: #393b34;

  text-align: left;
  cursor: pointer;
  transition: background .18s ease, border-color .18s ease, transform .18s ease;
}

.month-option:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(70, 75, 60, .25);
  background: rgba(255, 255, 255, .78);
}

.month-option.selected {
  border-color: rgba(91, 107, 78, .72);
  background: rgba(224, 232, 215, .82);
}

.month-number {
  color: #85877d;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
}

.month-name {
  margin-top: 3px;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
}

.month-count {
  margin-top: 4px;
  color: #85877d;
  font-size: 9px;
  line-height: 1.3;
}

.month-option.selected .month-name {
  color: #30392a;
}

.month-option:disabled {
  cursor: wait;
}

.month-option-spinner,
.month-spinner {
  display: block;
  width: 14px;
  height: 14px;
  border: 1.5px solid rgba(80, 80, 80, .18);
  border-top-color: #555;
  border-radius: 50%;
  animation: month-spin .7s linear infinite;
}

.month-option-spinner {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 11px;
  height: 11px;
}

.month-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 150px;
  color: #777970;
  text-align: center;
  font-size: 12px;
}

.month-state p {
  max-width: 100%;
  margin: 0;
  line-height: 1.7;
}

.month-state-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(160, 95, 65, .1);
  color: #a05f41;
  font-weight: 700;
}

.month-retry {
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, .1);
  border-radius: 9px;
  background: rgba(255, 255, 255, .65);
  color: #333;
  cursor: pointer;
}

.month-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 22px 16px;
  border-top: 1px solid rgba(0, 0, 0, .07);
}

.month-footer-note {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #85877d;
  font-size: 10px;
}

.footer-sparkle {
  color: #78876b;
  font-size: 14px;
}

.month-cancel {
  flex: 0 0 auto;
  height: 33px;
  padding: 0 15px;
  border: 1px solid rgba(0, 0, 0, .09);
  border-radius: 9px;
  background: rgba(255, 255, 255, .62);
  color: #4f504a;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.month-cancel:hover {
  background: rgba(255, 255, 255, .9);
}

.month-dialog-enter-active,
.month-dialog-leave-active {
  transition: opacity .2s ease;
}

.month-dialog-enter-active .month-dialog,
.month-dialog-leave-active .month-dialog {
  transition: transform .22s ease;
}

.month-dialog-enter-from,
.month-dialog-leave-to {
  opacity: 0;
}

.month-dialog-enter-from .month-dialog,
.month-dialog-leave-to .month-dialog {
  transform: translateY(8px) scale(.985);
}

@keyframes month-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 手机端 */
@media (max-width: 700px) {
  .month-backdrop {
    padding:
      max(10px, env(safe-area-inset-top))
      10px
      max(10px, env(safe-area-inset-bottom));
  }

  .month-dialog {
    width: 100%;
    max-width: 440px;
    max-height: calc(100vh - 20px);
    max-height: calc(
      100dvh
      - max(10px, env(safe-area-inset-top))
      - max(10px, env(safe-area-inset-bottom))
    );
    border-radius: 17px;
  }

  .month-dialog-header {
    gap: 10px;
    padding: 17px 16px 12px;
  }

  .month-heading h2 {
    font-size: 21px;
  }

  .month-heading p {
    font-size: 10px;
  }

  .month-summary {
    gap: 6px;
    margin: 0 16px;
    padding: 9px 10px;
    font-size: 9px;
  }

  .month-content {
    padding: 14px 16px 16px;
  }

  .year-group + .year-group {
    margin-top: 17px;
  }

  .year-heading h3 {
    font-size: 15px;
  }

  .month-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .month-option {
    min-height: 65px;
    padding: 8px;
    border-radius: 9px;
  }

  .month-name {
    font-size: 12px;
  }

  .month-count {
    margin-top: 3px;
  }

  .month-dialog-footer {
    gap: 8px;
    padding: 10px 16px max(12px, env(safe-area-inset-bottom));
  }

  .month-footer-note {
    min-width: 0;
    font-size: 9px;
  }

  .month-cancel {
    height: 32px;
  }
}

@media (max-width: 360px) {
  .month-backdrop {
    padding-right: 8px;
    padding-left: 8px;
  }

  .month-dialog {
    border-radius: 15px;
  }

  .month-dialog-header {
    padding-right: 13px;
    padding-left: 13px;
  }

  .month-summary {
    margin-right: 13px;
    margin-left: 13px;
  }

  .month-content {
    padding-right: 13px;
    padding-left: 13px;
  }

  .month-grid {
    gap: 5px;
  }

  .month-option {
    min-height: 62px;
    padding: 7px;
  }

  .month-dialog-footer {
    padding-right: 13px;
    padding-left: 13px;
  }
}

/* 深色系统主题 */
@media (prefers-color-scheme: dark) {
  .month-trigger {
    border-color: rgba(255, 255, 255, .1);
    background: rgba(35, 35, 35, .7);
    color: #eee;
  }

  .month-trigger:hover,
  .month-trigger.active {
    background: rgba(55, 55, 55, .9);
    border-color: rgba(255, 255, 255, .2);
  }

  .month-backdrop {
    background: rgba(0, 0, 0, .46);
  }

  .month-dialog {
    border-color: rgba(255, 255, 255, .17);
    background: rgba(35, 36, 34, .78);
    color: #eee;
  }

  .month-heading h2,
  .month-summary strong,
  .year-heading h3 {
    color: #f0f0eb;
  }

  .month-heading p,
  .month-eyebrow,
  .month-summary,
  .year-heading span,
  .month-number,
  .month-count,
  .month-footer-note {
    color: #b2b3aa;
  }

  .month-summary {
    border-color: rgba(255, 255, 255, .1);
    background: rgba(255, 255, 255, .055);
  }

  .summary-divider {
    background: rgba(255, 255, 255, .17);
  }

  .month-close,
  .month-cancel,
  .month-retry {
    border-color: rgba(255, 255, 255, .12);
    background: rgba(255, 255, 255, .07);
    color: #eee;
  }

  .month-close:hover,
  .month-cancel:hover {
    background: rgba(255, 255, 255, .14);
  }

  .month-option {
    border-color: rgba(255, 255, 255, .1);
    background: rgba(255, 255, 255, .045);
    color: #eee;
  }

  .month-option:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, .2);
    background: rgba(255, 255, 255, .1);
  }

  .month-option.selected {
    border-color: #8a987d;
    background: rgba(100, 119, 85, .35);
  }

  .month-option.selected .month-name {
    color: #e8eedf;
  }

  .month-dialog-footer {
    border-top-color: rgba(255, 255, 255, .1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .month-trigger,
  .month-option,
  .month-dialog-enter-active,
  .month-dialog-leave-active,
  .month-dialog-enter-active .month-dialog,
  .month-dialog-leave-active .month-dialog {
    transition: none;
  }

  .month-spinner,
  .month-option-spinner {
    animation: none;
  }
}

</style>
