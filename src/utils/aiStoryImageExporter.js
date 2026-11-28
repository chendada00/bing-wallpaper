import { createApp, nextTick } from 'vue'
import { toBlob } from 'html-to-image'
import AiStoryExportCard from '../components/AiStoryExportCard.vue'

const EXPORT_WIDTH = 560
const MAX_SIDE = 16000
const MAX_PIXELS = 24000000

function waitFrame() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

async function waitImages(root, timeoutMs = 15000) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('预览图片加载超时')), timeoutMs)
      const done = () => { clearTimeout(timer); resolve() }
      img.addEventListener('load', done, { once: true })
      img.addEventListener('error', () => { clearTimeout(timer); reject(new Error('预览图片加载失败')) }, { once: true })
    })
  }))
}

function pixelRatio(width, height) {
  return Math.max(1, Math.min(3, MAX_SIDE / Math.max(width, height), Math.sqrt(MAX_PIXELS / (width * height))))
}

/** 渲染独立 AI 视界卡片并返回 PNG Blob，不触发下载。 */
export async function exportAiStoryImage(item, { signal } = {}) {
  if (!item?.aiStory || typeof item.aiStory.story !== 'string' || !item.aiStory.story.trim()) {
    throw new Error('该日期没有有效的 AI 视界内容')
  }
  if (signal?.aborted) throw new DOMException('任务已取消', 'AbortError')

  const host = document.createElement('div')
  Object.assign(host.style, {
    position: 'fixed', left: '-10000px', top: '0',
    width: `${EXPORT_WIDTH}px`, minWidth: `${EXPORT_WIDTH}px`,
    maxWidth: `${EXPORT_WIDTH}px`, height: 'auto',
    overflow: 'visible', pointerEvents: 'none', zIndex: '-1'
  })
  document.body.appendChild(host)
  const app = createApp(AiStoryExportCard, { item })
  let blob

  try {
    app.mount(host)
    await nextTick()
    if (document.fonts?.ready) await document.fonts.ready
    await waitFrame()
    const root = host.querySelector('.ai-story-export-card')
    if (!root) throw new Error('AI 视界卡片渲染失败')
    await waitImages(root)
    await waitFrame()
    if (signal?.aborted) throw new DOMException('任务已取消', 'AbortError')

    const rect = root.getBoundingClientRect()
    const width = Math.ceil(rect.width)
    const height = Math.ceil(Math.max(root.scrollHeight, rect.height))
    if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`截图尺寸异常：${width} × ${height}`)
    }
    blob = await toBlob(root, {
      pixelRatio: pixelRatio(width, height),
      width, height, cacheBust: false, backgroundColor: '#17191f'
    })
    if (!blob?.size) throw new Error('PNG 生成失败')
    if (signal?.aborted) throw new DOMException('任务已取消', 'AbortError')
    return blob
  } finally {
    app.unmount()
    host.remove()
  }
}

/** 将 Blob 下载到用户本地。 */
export function downloadAiStoryBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}
