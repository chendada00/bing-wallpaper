<template>
  <div class="bulk-download">
    <button
      type="button"
      class="bulk-download-trigger"
      :aria-expanded="visible"
      aria-haspopup="dialog"
      title="批量下载壁纸"
      @click="openDialog"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v11m0 0 4-4m-4 4-4-4M4 17v3h16v-3" />
      </svg>
      <span>批量下载</span>
    </button>

    <Teleport to="body">
      <Transition name="bulk-dialog">
        <div
          v-if="visible"
          class="bulk-dialog-mask"
          @click.self="closeDialog"
          @keydown.esc="closeDialog"
        >
          <section
            class="bulk-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-dialog-title"
          >
            <header class="bulk-dialog-header">
              <div>
                <span class="bulk-eyebrow">WALLPAPER ARCHIVE</span>
                <h2 id="bulk-dialog-title">批量打包下载</h2>
                <p>把一段时间内的每日壁纸，整理成一个 ZIP 文件。</p>
              </div>
              <button
                class="bulk-close"
                type="button"
                aria-label="关闭"
                :disabled="busy && status !== 'paused'"
                @click="closeDialog"
              >×</button>
            </header>

            <div v-if="status === 'idle' || status === 'error'" class="bulk-config">
              <div class="bulk-date-grid">
                <label class="bulk-field">
                  <span>开始日期</span>
                  <input
                    v-model="startDate"
                    type="date"
                    :min="availableMinDate"
                    :max="endDate || availableMaxDate"
                    @change="validateRange"
                  />
                </label>
                <label class="bulk-field">
                  <span>结束日期</span>
                  <input
                    v-model="endDate"
                    type="date"
                    :min="startDate || availableMinDate"
                    :max="availableMaxDate"
                    @change="validateRange"
                  />
                </label>
              </div>

              <div class="bulk-quality">
                <span class="bulk-section-label">图片质量</span>
                <label class="bulk-quality-option" :class="{ selected: quality === 'preview' }">
                  <input v-model="quality" type="radio" value="preview" />
                  <span class="bulk-radio-mark"></span>
                  <span class="bulk-quality-copy">
                    <strong>预览图</strong>
                    <small>体积较小，下载更快，适合日常收藏</small>
                  </span>
                  <span class="bulk-quality-tag">轻量</span>
                </label>
                <label class="bulk-quality-option" :class="{ selected: quality === 'uhd' }">
                  <input v-model="quality" type="radio" value="uhd" />
                  <span class="bulk-radio-mark"></span>
                  <span class="bulk-quality-copy">
                    <strong>高清原图</strong>
                    <small>最高可达 3840 × 2160，适合桌面壁纸</small>
                  </span>
                  <span class="bulk-quality-tag">UHD</span>
                </label>
              </div>

              <div v-if="quality === 'uhd'" class="bulk-notice">
                <span class="bulk-notice-icon">i</span>
                <span>高清图片文件较大，批量下载可能需要较长时间，并占用较多网络流量和本地存储空间。</span>
              </div>

              <div class="bulk-limit">
                <span>最多选择 {{ maxMonths }} 个自然月（按起止月份计算）</span>
                <span v-if="rangeError" class="bulk-error">{{ rangeError }}</span>
                <span v-else-if="selectedMonthCount" class="bulk-range-count">{{ selectedMonthCount }} / {{ maxMonths }} 个月</span>
              </div>

              <p v-if="loadError" class="bulk-error bulk-load-error">{{ loadError }}</p>

              <button
                type="button"
                class="bulk-primary"
                :disabled="!canStart || preparing"
                @click="startDownload"
              >
                <span v-if="preparing" class="bulk-spinner"></span>
                {{ preparing ? '正在准备数据…' : '开始打包下载' }}
                <span v-if="!preparing" aria-hidden="true">↗</span>
              </button>
            </div>

            <div v-else class="bulk-progress">
              <div class="bulk-progress-heading">
                <div>
                  <span class="bulk-eyebrow">DOWNLOAD TASK</span>
                  <h3>{{ statusTitle }}</h3>
                </div>
                <span class="bulk-status-pill" :class="status">{{ statusLabel }}</span>
              </div>

              <div class="bulk-progress-summary">
                <strong>{{ completedCount }}</strong>
                <span>/ {{ totalCount }} 张图片</span>
                <strong class="bulk-percent">{{ progressPercent }}%</strong>
              </div>
              <div class="bulk-progress-track">
                <div class="bulk-progress-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>

              <div class="bulk-current-file">
                <span class="bulk-current-dot"></span>
                <span>{{ currentFile || '等待开始…' }}</span>
              </div>

              <div class="bulk-stats">
                <div><strong>{{ completedCount }}</strong><span>已完成</span></div>
                <div><strong>{{ cachedCount }}</strong><span>缓存复用</span></div>
                <div><strong>{{ failedItems.length }}</strong><span>失败</span></div>
              </div>

              <p v-if="status === 'paused'" class="bulk-hint">任务已暂停。已完成的图片会保留在本地缓存中。</p>
              <p v-else-if="status === 'done'" class="bulk-success">ZIP 文件已生成，图片文件名格式为「日期-标题.jpg」。</p>
              <p v-else-if="status === 'cancelled'" class="bulk-hint">任务已取消。已完成图片仍保留在本地缓存，下次选择相同日期范围和质量时会自动复用。</p>
              <p v-else-if="status === 'error'" class="bulk-error">{{ taskError }}</p>
              <p v-else class="bulk-hint">请保持页面打开。暂停任务不会清除已完成的图片。</p>

              <div v-if="failedItems.length" class="bulk-fail-list">
                <strong>未能下载的图片</strong>
                <span v-for="item in failedItems.slice(0, 5)" :key="item.date">{{ item.date }} · {{ item.reason }}</span>
                <span v-if="failedItems.length > 5">还有 {{ failedItems.length - 5 }} 项未显示</span>
              </div>

              <div class="bulk-actions">
                <button
                  v-if="status === 'running'"
                  type="button"
                  class="bulk-secondary"
                  @click="pauseDownload"
                >暂停</button>
                <button
                  v-if="status === 'paused'"
                  type="button"
                  class="bulk-primary bulk-action-primary"
                  @click="resumeDownload"
                >继续下载</button>
                <button
                  v-if="status === 'running' || status === 'paused'"
                  type="button"
                  class="bulk-danger"
                  @click="cancelDownload"
                >取消任务</button>
                <button
                  v-if="status === 'done' || status === 'cancelled' || status === 'error'"
                  type="button"
                  class="bulk-primary bulk-action-primary"
                  @click="resetTask"
                >新建下载</button>
                <button type="button" class="bulk-secondary" @click="closeDialog">关闭</button>
              </div>
            </div>

            <footer class="bulk-dialog-footer">
              <span>文件按日期命名，标题中的特殊字符会自动清理。</span>
              <span>最大跨度：{{ maxMonths }} 个月</span>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  BlobReader,
  BlobWriter,
  ZipWriter
} from '@zip.js/zip.js'

const props = defineProps({
  dataBaseUrl: {
    type: String,
    required: true
  },
  maxMonths: {
    type: Number,
    default: Number(import.meta.env.VITE_BULK_DOWNLOAD_MAX_MONTHS || 3)
  }
})

const UHD_BASE_URL = (
  import.meta.env.VITE_UHD_BASE_URL ||
  'https://bing-uhd.伴随.cn'
).replace(/\/$/, '')

const visible = ref(false)
const startDate = ref('')
const endDate = ref('')
const quality = ref('preview')
const preparing = ref(false)
const loadError = ref('')
const rangeError = ref('')
const status = ref('idle')
const taskError = ref('')
const totalCount = ref(0)
const completedCount = ref(0)
const cachedCount = ref(0)
const currentFile = ref('')
const failedItems = ref([])
const availableMinDate = ref('')
const availableMaxDate = ref('')

let indexPromise = null
let activeController = null
let pauseResolver = null
let pauseRequested = false
let cancelRequested = false
let zipWriter = null
let activeWritable = null
let taskItems = []
let taskToken = 0

const busy = computed(() => status.value === 'running' || status.value === 'paused')
const selectedMonthCount = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  return monthDistance(startDate.value, endDate.value) + 1
})
const canStart = computed(() => {
  return Boolean(
    startDate.value &&
    endDate.value &&
    !rangeError.value &&
    selectedMonthCount.value <= props.maxMonths
  )
})
const progressPercent = computed(() => {
  if (!totalCount.value) return 0
  return Math.min(100, Math.round(completedCount.value / totalCount.value * 100))
})
const statusTitle = computed(() => ({
  running: '正在打包壁纸',
  paused: '下载已暂停',
  done: '打包完成',
  cancelled: '任务已取消',
  error: '打包未完成'
}[status.value] || '下载任务'))
const statusLabel = computed(() => ({
  running: '进行中',
  paused: '已暂停',
  done: '已完成',
  cancelled: '已取消',
  error: '异常'
}[status.value] || '准备中'))

function monthDistance(from, to) {
  const a = new Date(`${from.slice(0, 7)}-01T00:00:00`)
  const b = new Date(`${to.slice(0, 7)}-01T00:00:00`)
  return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth()
}

function validateRange() {
  rangeError.value = ''
  if (!startDate.value || !endDate.value) return
  if (startDate.value > endDate.value) {
    rangeError.value = '开始日期不能晚于结束日期。'
    return
  }
  const count = monthDistance(startDate.value, endDate.value) + 1
  if (count > props.maxMonths) {
    rangeError.value = `当前范围跨越 ${count} 个自然月，最多只能选择 ${props.maxMonths} 个月。`
  }
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function shiftDate(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

async function loadHistoryIndex() {
  if (indexPromise) return indexPromise
  indexPromise = fetch(`${props.dataBaseUrl.replace(/\/$/, '')}/data/index.json`, {
    cache: 'force-cache'
  }).then(async response => {
    if (!response.ok) throw new Error(`历史索引加载失败（HTTP ${response.status}）`)
    const data = await response.json()
    if (data?.version !== 1 || !Array.isArray(data.items)) {
      throw new Error('历史索引格式不正确')
    }
    const dates = data.items
      .map(row => String(row?.[0] || ''))
      .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort()
    if (!dates.length) throw new Error('历史索引中没有可下载的壁纸')
    availableMinDate.value = dates[0]
    availableMaxDate.value = dates[dates.length - 1]
    return dates
  }).catch(error => {
    indexPromise = null
    throw error
  })
  return indexPromise
}

async function openDialog() {
  visible.value = true
  if (availableMaxDate.value) return
  preparing.value = true
  loadError.value = ''
  try {
    const dates = await loadHistoryIndex()
    endDate.value = dates[dates.length - 1]
    startDate.value = dates.includes(shiftDate(endDate.value, -29))
      ? shiftDate(endDate.value, -29)
      : dates[Math.max(0, dates.length - 30)]
    validateRange()
  } catch (error) {
    loadError.value = error.message || '无法读取历史壁纸索引。'
  } finally {
    preparing.value = false
  }
}

function closeDialog() {
  if (busy.value) return
  visible.value = false
}

function safeFilePart(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[. ]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'Bing Wallpaper'
}

function getMonthKeys(from, to) {
  const keys = []
  const cursor = new Date(`${from.slice(0, 7)}-01T12:00:00`)
  const end = new Date(`${to.slice(0, 7)}-01T12:00:00`)
  while (cursor <= end) {
    keys.push(`${cursor.getFullYear()}/${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return keys
}

async function loadRangeItems() {
  const months = getMonthKeys(startDate.value, endDate.value)
  const results = await Promise.all(months.map(async key => {
    const [year, month] = key.split('/')
    const url = `${props.dataBaseUrl.replace(/\/$/, '')}/data/${year}/${month}.json`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${year}-${month} 数据加载失败（HTTP ${response.status}）`)
    const data = await response.json()
    return Array.isArray(data.items) ? data.items : []
  }))
  return results.flat()
    .filter(item => item?.date >= startDate.value && item?.date <= endDate.value)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function getImageUrl(item) {
  if (quality.value === 'preview') {
    return item.preview || ''
  }
  if (item.image) return item.image
  if (item.date) {
    const [year, month] = item.date.split('-')
    return `${UHD_BASE_URL}/images/${year}/${month}/${item.date}.jpg`
  }
  return item.sourceImage || ''
}

function getFallbackUrl(item, primary) {
  if (quality.value === 'uhd' && item.sourceImage && item.sourceImage !== primary) {
    return item.sourceImage
  }
  return ''
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('浏览器不支持本地缓存'))
      return
    }
    const request = indexedDB.open('bing-wallpaper-download-cache', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('images')) {
        const store = db.createObjectStore('images', { keyPath: 'key' })
        store.createIndex('savedAt', 'savedAt')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function cacheGet(key) {
  let db
  try {
    db = await openDatabase()
    return await new Promise((resolve, reject) => {
      const request = db.transaction('images', 'readonly').objectStore('images').get(key)
      request.onsuccess = () => resolve(request.result?.blob || null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  } finally {
    db?.close()
  }
}

async function cachePut(key, blob) {
  let db
  try {
    db = await openDatabase()
    await new Promise((resolve, reject) => {
      const request = db.transaction('images', 'readwrite')
        .objectStore('images')
        .put({ key, blob, savedAt: Date.now() })
      request.onsuccess = resolve
      request.onerror = () => reject(request.error)
    })
    return true
  } catch (error) {
    console.warn('图片缓存写入失败，将继续本次打包：', error)
    return false
  } finally {
    db?.close()
  }
}

async function fetchBlob(url, signal, onProgress) {
  const response = await fetch(url, { signal, mode: 'cors' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  if (!response.body) return response.blob()

  const reader = response.body.getReader()
  const chunks = []
  let loaded = 0
  const total = Number(response.headers.get('content-length')) || 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.byteLength
      onProgress?.(loaded, total)
    }
  } finally {
    reader.releaseLock()
  }
  return new Blob(chunks, { type: response.headers.get('content-type') || 'image/jpeg' })
}

function waitWhilePaused() {
  if (!pauseRequested) return Promise.resolve()
  return new Promise(resolve => { pauseResolver = resolve })
}

async function createZipWriter() {
  const fileName = `Bing-Wallpaper-${startDate.value}_${endDate.value}.zip`
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }]
      })
      activeWritable = await handle.createWritable()
      return new ZipWriter(activeWritable, { bufferedWrite: true })
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      console.warn('无法使用流式文件写入，将使用浏览器内存生成 ZIP：', error)
    }
  }
  return new ZipWriter(new BlobWriter('application/zip'), { bufferedWrite: true })
}

async function startDownload() {
  validateRange()
  if (!canStart.value || preparing.value) return
  preparing.value = true
  loadError.value = ''
  taskError.value = ''
  failedItems.value = []
  completedCount.value = 0
  cachedCount.value = 0
  currentFile.value = ''
  cancelRequested = false
  pauseRequested = false
  const token = ++taskToken

  try {
    // 先在用户点击事件仍有效时请求保存位置；随后再加载数据。
    zipWriter = await createZipWriter()
    taskItems = await loadRangeItems()
    if (!taskItems.length) throw new Error('所选日期范围内没有可下载的壁纸。')
    totalCount.value = taskItems.length
    status.value = 'running'
    preparing.value = false
    await runTask(token)
  } catch (error) {
    preparing.value = false
    if (error?.name === 'AbortError') {
      status.value = 'cancelled'
    } else {
      taskError.value = error.message || '创建 ZIP 文件失败。'
      status.value = 'error'
      loadError.value = taskError.value
    }
    if (activeWritable && status.value !== 'done') {
      try { await activeWritable.abort() } catch {}
    }
  }
}

async function runTask(token) {
  for (let index = completedCount.value; index < taskItems.length; index += 1) {
    if (token !== taskToken || cancelRequested) break
    await waitWhilePaused()
    if (cancelRequested || token !== taskToken) break

    const item = taskItems[index]
    const date = item.date
    const title = safeFilePart(item.title || item.description || 'Bing Wallpaper')
    const fileName = `${date}-${title}.jpg`
    const cacheKey = `${quality.value}:${date}:${getImageUrl(item)}`
    currentFile.value = fileName

    let blob = await cacheGet(cacheKey)
    let fromCache = Boolean(blob)

    if (!blob) {
      const primary = getImageUrl(item)
      if (!primary) {
        failedItems.value.push({ date, reason: '没有可用图片地址' })
        completedCount.value += 1
        continue
      }

      let lastError = null
      const urls = [primary, getFallbackUrl(item, primary)].filter(Boolean)
      for (const url of urls) {
        try {
          activeController = new AbortController()
          blob = await fetchBlob(url, activeController.signal, (loaded, total) => {
            if (total > 0) {
              currentFile.value = `${fileName} · ${(loaded / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB`
            } else {
              currentFile.value = `${fileName} · ${(loaded / 1024 / 1024).toFixed(1)} MB`
            }
          })
          if (!blob.size) throw new Error('图片内容为空')
          await cachePut(cacheKey, blob)
          lastError = null
          break
        } catch (error) {
          lastError = error
          if (pauseRequested || cancelRequested) break
        } finally {
          activeController = null
        }
      }

      if (pauseRequested) {
        index -= 1
        await waitWhilePaused()
        if (cancelRequested) break
        continue
      }
      if (cancelRequested) break
      if (!blob) {
        failedItems.value.push({ date, reason: lastError?.message || '下载失败' })
        completedCount.value += 1
        continue
      }
    }

    if (fromCache) cachedCount.value += 1
    try {
      await zipWriter.add(fileName, new BlobReader(blob), { level: 0 })
      completedCount.value += 1
    } catch (error) {
      failedItems.value.push({ date, reason: `写入 ZIP 失败：${error.message}` })
      completedCount.value += 1
    }
  }

  if (cancelRequested || token !== taskToken) {
    status.value = 'cancelled'
    if (activeWritable) {
      try { await activeWritable.abort() } catch {}
    }
    return
  }

  if (pauseRequested) {
    status.value = 'paused'
    return
  }

  try {
    if (activeWritable) {
      await zipWriter.close()
      status.value = 'done'
    } else {
      const zipBlob = await zipWriter.close()
      saveBlob(zipBlob, `Bing-Wallpaper-${startDate.value}_${endDate.value}.zip`)
      status.value = 'done'
    }
    if (failedItems.value.length) {
      taskError.value = `${failedItems.value.length} 张图片未能加入压缩包，请检查失败列表。`
    }
  } catch (error) {
    taskError.value = error.message || 'ZIP 文件生成失败。'
    status.value = 'error'
    if (activeWritable) {
      try { await activeWritable.abort() } catch {}
    }
  }
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function pauseDownload() {
  if (status.value !== 'running') return
  pauseRequested = true
  status.value = 'paused'
  activeController?.abort()
}

function resumeDownload() {
  if (status.value !== 'paused') return
  pauseRequested = false
  status.value = 'running'
  const resolve = pauseResolver
  pauseResolver = null
  resolve?.()
}

function cancelDownload() {
  cancelRequested = true
  pauseRequested = false
  activeController?.abort()
  const resolve = pauseResolver
  pauseResolver = null
  resolve?.()
  if (status.value === 'paused') status.value = 'cancelled'
}

function resetTask() {
  taskToken += 1
  status.value = 'idle'
  taskError.value = ''
  totalCount.value = 0
  completedCount.value = 0
  cachedCount.value = 0
  currentFile.value = ''
  failedItems.value = []
  taskItems = []
  zipWriter = null
  activeWritable = null
  cancelRequested = false
  pauseRequested = false
}

onBeforeUnmount(() => {
  cancelRequested = true
  activeController?.abort()
  const resolve = pauseResolver
  pauseResolver = null
  resolve?.()
  if (activeWritable) {
    activeWritable.abort().catch(() => {})
  }
})
</script>

<style scoped>
.bulk-download-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.62);
  border-radius: 11px;
  color: #333;
  background: rgba(255,255,255,.72);
  box-shadow: 0 3px 12px rgba(0,0,0,.055), inset 0 1px 0 rgba(255,255,255,.7);
  backdrop-filter: blur(16px) saturate(145%);
  -webkit-backdrop-filter: blur(16px) saturate(145%);
  font: inherit;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
  cursor: pointer;
  transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
}
.bulk-download-trigger:hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,.92);
  box-shadow: 0 6px 18px rgba(0,0,0,.09);
}
.bulk-download-trigger svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bulk-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15,18,22,.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.bulk-dialog {
  width: min(100%, 490px);
  max-height: min(90vh, 780px);
  overflow: auto;
  border: 1px solid rgba(255,255,255,.68);
  border-radius: 23px;
  color: #262a30;
  background: rgba(250,250,249,.94);
  box-shadow: 0 28px 90px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.8);
}
.bulk-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 25px 26px 18px;
}
.bulk-eyebrow {
  display: block;
  margin-bottom: 7px;
  color: #92979d;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .15em;
}
.bulk-dialog-header h2 {
  margin: 0;
  color: #252a30;
  font-size: 21px;
  font-weight: 750;
  letter-spacing: -.5px;
}
.bulk-dialog-header p {
  margin: 7px 0 0;
  color: #7b8188;
  font-size: 11px;
  line-height: 1.6;
}
.bulk-close {
  flex: 0 0 31px;
  width: 31px;
  height: 31px;
  border: 1px solid rgba(0,0,0,.07);
  border-radius: 50%;
  color: #626970;
  background: rgba(255,255,255,.8);
  font-size: 21px;
  line-height: 1;
  cursor: pointer;
}
.bulk-config, .bulk-progress { padding: 0 26px 23px; }
.bulk-date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.bulk-field { display: grid; gap: 7px; color: #6f767e; font-size: 10px; font-weight: 650; }
.bulk-field input {
  width: 100%;
  min-width: 0;
  height: 42px;
  padding: 0 11px;
  border: 1px solid #e2e5e7;
  border-radius: 11px;
  outline: none;
  color: #30363c;
  background: rgba(255,255,255,.78);
  font: inherit;
  font-size: 12px;
}
.bulk-field input:focus { border-color: #8b9eaf; box-shadow: 0 0 0 3px rgba(110,139,163,.12); }
.bulk-quality { display: grid; gap: 9px; margin-top: 21px; }
.bulk-section-label { color: #737b83; font-size: 10px; font-weight: 700; }
.bulk-quality-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 63px;
  padding: 10px 12px;
  border: 1px solid #e5e7e8;
  border-radius: 13px;
  background: rgba(255,255,255,.52);
  cursor: pointer;
}
.bulk-quality-option.selected { border-color: #8b9eaf; background: rgba(235,241,245,.72); box-shadow: inset 0 0 0 1px rgba(139,158,175,.15); }
.bulk-quality-option input { position: absolute; opacity: 0; pointer-events: none; }
.bulk-radio-mark { flex: 0 0 15px; width: 15px; height: 15px; border: 1.5px solid #b5bbc0; border-radius: 50%; }
.bulk-quality-option.selected .bulk-radio-mark { border: 5px solid #687f92; }
.bulk-quality-copy { display: grid; flex: 1; gap: 4px; min-width: 0; }
.bulk-quality-copy strong { color: #343b42; font-size: 11px; }
.bulk-quality-copy small { color: #858c92; font-size: 9px; line-height: 1.45; }
.bulk-quality-tag { padding: 4px 7px; border-radius: 7px; color: #75828d; background: #edf0f2; font-size: 8px; font-weight: 750; letter-spacing: .04em; }
.bulk-notice {
  display: flex;
  gap: 9px;
  margin-top: 12px;
  padding: 11px 12px;
  border: 1px solid #eadfc9;
  border-radius: 11px;
  color: #8a7049;
  background: #fbf6eb;
  font-size: 9px;
  line-height: 1.6;
}
.bulk-notice-icon { display: grid; flex: 0 0 15px; width: 15px; height: 15px; place-items: center; border: 1px solid #c9ad7d; border-radius: 50%; font-size: 9px; font-weight: 700; }
.bulk-limit { display: flex; justify-content: space-between; gap: 10px; margin-top: 13px; color: #8a9096; font-size: 9px; }
.bulk-range-count { white-space: nowrap; }
.bulk-error { color: #b44e4e; }
.bulk-load-error { margin: 12px 0 0; font-size: 10px; }
.bulk-primary, .bulk-secondary, .bulk-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 15px;
  border-radius: 11px;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .16s ease, opacity .16s ease, background .16s ease;
}
.bulk-primary { width: 100%; margin-top: 19px; border: 1px solid #313b44; color: #fff; background: #303b45; box-shadow: 0 5px 14px rgba(38,51,62,.17); }
.bulk-primary:hover:not(:disabled) { transform: translateY(-1px); background: #202b35; }
.bulk-primary:disabled { opacity: .42; cursor: not-allowed; }
.bulk-secondary { border: 1px solid #e0e3e5; color: #515b63; background: rgba(255,255,255,.75); }
.bulk-danger { border: 1px solid #efd9d9; color: #a94d4d; background: #fff8f8; }
.bulk-action-primary { width: auto; margin: 0; }
.bulk-spinner {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.35); border-top-color: white;
  border-radius: 50%; animation: bulk-spin .7s linear infinite;
}
.bulk-progress-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.bulk-progress-heading h3 { margin: 0; color: #2d343a; font-size: 16px; }
.bulk-status-pill { padding: 5px 9px; border-radius: 20px; color: #68737c; background: #edf0f2; font-size: 9px; font-weight: 700; }
.bulk-status-pill.running { color: #55768d; background: #e9f1f6; }
.bulk-status-pill.done { color: #47795e; background: #eaf4ed; }
.bulk-status-pill.error { color: #a94d4d; background: #faeded; }
.bulk-progress-summary { display: flex; align-items: baseline; gap: 5px; margin-top: 23px; color: #8a9096; font-size: 10px; }
.bulk-progress-summary strong { color: #303941; font-size: 22px; }
.bulk-progress-summary .bulk-percent { margin-left: auto; color: #596f80; font-size: 17px; }
.bulk-progress-track { height: 8px; margin-top: 9px; overflow: hidden; border-radius: 9px; background: #e8ebed; }
.bulk-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg,#71899a,#a4b8c5); transition: width .2s ease; }
.bulk-current-file { display: flex; align-items: center; gap: 8px; min-width: 0; margin-top: 12px; color: #7b838a; font-size: 9px; }
.bulk-current-file span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bulk-current-dot { flex: 0 0 6px; width: 6px; height: 6px; border-radius: 50%; background: #8ba5b6; }
.bulk-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 20px; padding: 13px 0; border-top: 1px solid #e9ebed; border-bottom: 1px solid #e9ebed; }
.bulk-stats div { display: grid; gap: 4px; text-align: center; }
.bulk-stats strong { color: #3e4850; font-size: 15px; }
.bulk-stats span { color: #92989d; font-size: 9px; }
.bulk-hint, .bulk-success { margin: 13px 0 0; color: #8a9096; font-size: 10px; line-height: 1.6; }
.bulk-success { color: #548064; }
.bulk-fail-list { display: grid; gap: 5px; max-height: 100px; overflow: auto; margin-top: 12px; padding: 10px; border-radius: 9px; color: #9b6262; background: #fff3f3; font-size: 9px; }
.bulk-fail-list strong { color: #914d4d; }
.bulk-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 18px; }
.bulk-dialog-footer { display: flex; justify-content: space-between; gap: 12px; padding: 12px 26px 15px; border-top: 1px solid rgba(0,0,0,.055); color: #9a9fa4; background: rgba(245,246,246,.55); font-size: 8px; }
.bulk-dialog-enter-active, .bulk-dialog-leave-active { transition: opacity .18s ease; }
.bulk-dialog-enter-active .bulk-dialog, .bulk-dialog-leave-active .bulk-dialog { transition: transform .2s ease; }
.bulk-dialog-enter-from, .bulk-dialog-leave-to { opacity: 0; }
.bulk-dialog-enter-from .bulk-dialog, .bulk-dialog-leave-to .bulk-dialog { transform: translateY(8px) scale(.99); }
@keyframes bulk-spin { to { transform: rotate(360deg); } }

@media (prefers-color-scheme: dark) {
  .bulk-download-trigger { color: #eee; background: rgba(38,40,43,.82); border-color: rgba(255,255,255,.14); }
  .bulk-download-trigger:hover { background: rgba(52,55,59,.95); }
  .bulk-dialog { color: #e9ecef; background: rgba(35,38,41,.97); border-color: rgba(255,255,255,.12); }
  .bulk-dialog-header h2, .bulk-progress-heading h3, .bulk-quality-copy strong, .bulk-progress-summary strong { color: #edf0f2; }
  .bulk-dialog-header p, .bulk-field, .bulk-section-label, .bulk-hint, .bulk-dialog-footer { color: #a5adb4; }
  .bulk-field input { color: #eee; background: #292e33; border-color: #444b51; color-scheme: dark; }
  .bulk-quality-option { background: #292e33; border-color: #444b51; }
  .bulk-quality-option.selected { background: #303c45; border-color: #72899a; }
  .bulk-quality-tag { color: #b7c3cc; background: #3a4248; }
  .bulk-notice { color: #d5bd91; background: #393329; border-color: #62543e; }
  .bulk-primary { color: #20262b; background: #d7e0e6; border-color: #d7e0e6; }
  .bulk-primary:hover:not(:disabled) { background: #e8eef2; }
  .bulk-secondary { color: #d8dde1; background: #30363b; border-color: #4a5157; }
  .bulk-danger { color: #e0a3a3; background: #392b2b; border-color: #614040; }
  .bulk-close { color: #ddd; background: #30363b; border-color: #4a5157; }
  .bulk-progress-track { background: #3a4147; }
  .bulk-stats { border-color: #41484e; }
  .bulk-stats strong { color: #e0e5e8; }
  .bulk-dialog-footer { background: rgba(20,22,24,.3); border-color: #41484e; }
}
@media (max-width: 520px) {
  .bulk-dialog-mask { padding: 10px; align-items: end; }
  .bulk-dialog { width: 100%; max-height: 92vh; border-radius: 20px 20px 14px 14px; }
  .bulk-dialog-header { padding: 21px 19px 15px; }
  .bulk-config, .bulk-progress { padding: 0 19px 19px; }
  .bulk-dialog-footer { padding-right: 19px; padding-left: 19px; }
  .bulk-date-grid { gap: 8px; }
  .bulk-dialog-header h2 { font-size: 19px; }
}
@media (max-width: 360px) {
  .bulk-download-trigger { width: 34px; min-width: 34px; padding: 0; }
  .bulk-download-trigger span { display: none; }
  .bulk-limit { flex-direction: column; gap: 4px; }
  .bulk-dialog-footer { flex-direction: column; gap: 4px; }
}
</style>
