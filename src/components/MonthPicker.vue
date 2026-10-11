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

    <Transition name="month-dialog">
      <div
        v-if="open"
        class="month-backdrop"
        @click.self="closePicker"
      >
        <section
          class="month-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="month-dialog-title"
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

.month-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(18, 20, 24, .34);
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
}

.month-dialog {
  display: flex;
  flex-direction: column;
  width: min(560px, 100%);
  max-height: min(760px, calc(100dvh - 40px));
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .8);
  border-radius: 23px;
  background: rgba(250, 250, 248, .97);
  color: #292929;
  box-shadow: 0 30px 100px rgba(0, 0, 0, .22);
}

.month-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 26px 27px 20px;
}

.month-heading {
  min-width: 0;
}

.month-eyebrow {
  display: block;
  margin-bottom: 10px;
  color: #92928d;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
}

.month-heading h2 {
  margin: 0;
  color: #222;
  font-size: 25px;
  font-weight: 700;
  letter-spacing: -.7px;
}

.month-heading p {
  margin: 9px 0 0;
  color: #888881;
  font-size: 12px;
  line-height: 1.6;
}

.month-close {
  display: grid;
  flex: 0 0 32px;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, .07);
  border-radius: 10px;
  background: rgba(0, 0, 0, .035);
  color: #666;
  cursor: pointer;
}

.month-close svg {
  width: 16px;
  height: 16px;
}

.month-close:hover {
  background: rgba(0, 0, 0, .075);
}

.month-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0 27px;
  padding: 12px 13px;
  border: 1px solid rgba(0, 0, 0, .045);
  border-radius: 12px;
  background: rgba(0, 0, 0, .025);
  color: #898981;
  font-size: 10px;
}

.month-summary strong {
  color: #333;
  font-weight: 700;
}

.summary-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #728a70;
}

.summary-divider {
  width: 1px;
  height: 12px;
  margin: 0 3px;
  background: rgba(0, 0, 0, .12);
}

.month-content {
  flex: 1 1 auto;
  min-height: 130px;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 22px 27px 20px;
}

.year-group + .year-group {
  margin-top: 25px;
}

.year-heading {
  display: flex;
  align-items: baseline;
  gap: 9px;
  margin-bottom: 12px;
}

.year-heading h3 {
  margin: 0;
  color: #343430;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -.4px;
}

.year-heading span {
  color: #aaa9a1;
  font-size: 10px;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}

.month-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  min-height: 100px;
  padding: 12px 11px 10px;
  border: 1px solid rgba(0, 0, 0, .075);
  border-radius: 13px;
  background: rgba(255, 255, 255, .75);
  color: #393934;
  text-align: left;
  cursor: pointer;
  transition: transform .2s ease, border-color .2s ease, background .2s ease;
}

.month-option:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(60, 65, 50, .25);
  background: #fff;
}

.month-option.selected {
  border-color: #454940;
  background: #eceee7;
}

.month-number {
  color: #aaa99f;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.month-name {
  margin-top: 5px;
  font-size: 14px;
  font-weight: 700;
}

.month-count {
  margin-top: 7px;
  color: #96968e;
  font-size: 9px;
}

.month-option.selected .month-name {
  color: #30352d;
}

.month-option:disabled {
  cursor: wait;
}

.month-option-spinner,
.month-spinner {
  display: block;
  width: 15px;
  height: 15px;
  border: 1.5px solid rgba(80, 80, 80, .18);
  border-top-color: #555;
  border-radius: 50%;
  animation: month-spin .7s linear infinite;
}

.month-option-spinner {
  position: absolute;
  top: 12px;
  right: 10px;
  width: 12px;
  height: 12px;
}

.month-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 170px;
  color: #898981;
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
  background: #fff;
  color: #333;
  cursor: pointer;
}

.month-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 27px 19px;
  border-top: 1px solid rgba(0, 0, 0, .055);
}

.month-footer-note {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #99988f;
  font-size: 10px;
}

.footer-sparkle {
  color: #858c76;
  font-size: 14px;
}

.month-cancel {
  height: 33px;
  padding: 0 15px;
  border: 1px solid rgba(0, 0, 0, .09);
  border-radius: 9px;
  background: #fff;
  color: #555;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.month-cancel:hover {
  background: #f0f0ec;
}

.month-dialog-enter-active,
.month-dialog-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}

.month-dialog-enter-active .month-dialog,
.month-dialog-leave-active .month-dialog {
  transition: transform .25s cubic-bezier(.2, .8, .2, 1);
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
  to { transform: rotate(360deg); }
}

@media (max-width: 700px) {
  .month-trigger {
    gap: 5px;
    height: 33px;
    padding: 0 8px;
    font-size: 10px;
  }

  .month-backdrop {
    align-items: end;
    padding: 10px;
  }

  .month-dialog {
    width: 100%;
    max-height: min(720px, calc(100dvh - 20px));
    border-radius: 21px;
  }

  .month-dialog-header {
    padding: 22px 19px 16px;
  }

  .month-heading h2 {
    font-size: 22px;
  }

  .month-summary {
    margin: 0 19px;
    padding: 10px;
    font-size: 9px;
  }

  .month-content {
    padding: 20px 19px;
  }

  .month-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .month-option {
    min-height: 91px;
    padding: 10px 9px;
  }

  .month-name {
    font-size: 13px;
  }

  .month-dialog-footer {
    padding: 13px 19px 17px;
  }
}

@media (max-width: 380px) {
  .month-footer-note {
    font-size: 9px;
  }

  .month-grid {
    gap: 6px;
  }

  .month-option {
    min-height: 85px;
  }
}

@media (prefers-color-scheme: dark) {
  .month-trigger {
    border-color: rgba(255, 255, 255, .1);
    background: rgba(35, 35, 35, .8);
    color: #eee;
  }

  .month-trigger:hover,
  .month-trigger.active {
    background: #333;
    border-color: #555;
  }

  .month-dialog {
    border-color: rgba(255, 255, 255, .1);
    background: rgba(28, 28, 28, .98);
    color: #eee;
  }

  .month-heading h2,
  .month-summary strong,
  .year-heading h3 {
    color: #eee;
  }

  .month-heading p,
  .month-eyebrow,
  .month-summary,
  .year-heading span,
  .month-number,
  .month-count,
  .month-footer-note {
    color: #aaa;
  }

  .month-summary {
    border-color: rgba(255, 255, 255, .07);
    background: rgba(255, 255, 255, .035);
  }

  .summary-divider {
    background: rgba(255, 255, 255, .15);
  }

  .month-close,
  .month-cancel,
  .month-retry {
    border-color: rgba(255, 255, 255, .1);
    background: #333;
    color: #ddd;
  }

  .month-close:hover,
  .month-cancel:hover {
    background: #414141;
  }

  .month-option {
    border-color: rgba(255, 255, 255, .08);
    background: rgba(255, 255, 255, .035);
    color: #ddd;
  }

  .month-option:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, .2);
    background: #333;
  }

  .month-option.selected {
    border-color: #858c76;
    background: #363c32;
  }

  .month-option.selected .month-name {
    color: #e4eadc;
  }

  .month-dialog-footer {
    border-top-color: rgba(255, 255, 255, .08);
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
