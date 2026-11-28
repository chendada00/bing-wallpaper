<template>
  <article ref="rootRef" class="ai-story-export-card" :style="themeStyle">
    <div class="accent-line" aria-hidden="true"></div>
    <header class="header">
      <div class="mark" aria-hidden="true">✳</div>
      <div class="heading"><strong>光影札记</strong><span>每一幕都有未说完的故事</span></div>
    </header>
    <main class="content">
      <div v-if="item?.date" class="meta">
        <i></i><span>{{ item.date }}</span>
        <span v-if="story.generatedAt" class="generated">生成于 {{ formatDate(story.generatedAt) }}</span>
      </div>
      <div class="intro">
        <div class="title-block">
          <p class="kicker">A LITTLE STORY BEHIND THE VIEW</p>
          <h2>{{ story.title || item?.title || '这一刻的风景' }}</h2>
          <p v-if="story.subtitle" class="subtitle">{{ story.subtitle }}</p>
        </div>
        <figure v-if="previewUrl" class="preview">
          <img :src="previewUrl" :alt="`${item?.date || ''} 壁纸预览图`" crossorigin="anonymous" referrerpolicy="no-referrer"/>
        </figure>
      </div>
      <div class="divider"><span/><span/><span/></div>
      <section class="section">
        <div class="section-heading"><span class="index">01</span><h3>意境漫游</h3></div>
        <template v-if="paragraphs.length >= 2">
          <div class="subsection">
            <h4 class="subheading">① 光影与景致</h4><p class="body">{{ paragraphs[0] }}</p>
          </div>
          <div class="highlight">
            <div class="insight-heading"><div><h4 class="subheading highlighted">② 画面之外</h4><span class="label">BEYOND THE FRAME</span></div><span class="symbol">✳</span></div>
            <p class="body body-highlight">{{ paragraphs.slice(1).join('\n\n') }}</p>
            <div class="end"><span></span></div>
          </div>
        </template>
        <p v-else class="body">{{ paragraphs[0] || story.story }}</p>
      </section>
      <section v-if="mood.length" class="section">
        <div class="section-heading"><span class="index">02</span><h3>心境回声</h3></div>
        <div class="tags"><span v-for="(tag,i) in mood" :key="`m-${i}`" class="tag mood">{{ tag }}</span></div>
      </section>
      <section v-if="visual.length" class="section">
        <div class="section-heading"><span class="index">03</span><h3>细节之诗</h3></div>
        <div class="tags"><span v-for="(tag,i) in visual" :key="`v-${i}`" class="tag visual">{{ tag }}</span></div>
      </section>
      <footer class="footer"><span class="info">ⓘ</span><span>AI 生成内容，仅供欣赏与参考</span></footer>
    </main>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ item: { type: Object, required: true } })
const rootRef = ref(null)
defineExpose({ rootRef })

const story = computed(() => props.item?.aiStory && typeof props.item.aiStory === 'object' ? props.item.aiStory : {})
const paragraphs = computed(() => {
  const value = story.value.story
  if (typeof value !== 'string' || !value.trim()) return []
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n\s*\n+/).map(v => v.trim()).filter(Boolean)
})
const normalize = value => Array.isArray(value) ? value.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()).slice(0,8) : []
const mood = computed(() => normalize(story.value.mood))
const visual = computed(() => normalize(story.value.visualElements))
const previewUrl = computed(() => {
  const value = props.item?.preview
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value, window.location.origin)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch { return '' }
})
const colors = computed(() => props.item?.color || {})
const palette = computed(() => [colors.value.Vibrant,colors.value.LightVibrant,colors.value.DarkVibrant,colors.value.Muted,colors.value.LightMuted,colors.value.DarkMuted].filter(v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)))
const themeStyle = computed(() => ({
  '--ai-accent': palette.value[0] || '#9588df',
  '--ai-accent-2': palette.value[1] || '#c2a2dc',
  '--ai-accent-3': palette.value[2] || '#86a9b7'
}))
function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0,10)
  return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
}
</script>

<style scoped>
.ai-story-export-card{position:relative;isolation:isolate;width:560px;min-width:560px;max-width:560px;box-sizing:border-box;overflow:visible;border:1px solid rgba(255,255,255,.17);border-radius:23px;color:#f7f7fa;background:linear-gradient(145deg,rgba(35,37,45,.97),rgba(18,20,27,.985) 62%);box-shadow:0 32px 100px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.08);font-family:inherit}
.ai-story-export-card *{box-sizing:border-box}
.accent-line{position:absolute;top:0;left:8%;right:8%;height:2px;background:linear-gradient(90deg,transparent,var(--ai-accent),var(--ai-accent-2),var(--ai-accent-3),transparent)}
.header{display:flex;align-items:center;gap:12px;padding:21px 23px 17px;border-bottom:1px solid rgba(255,255,255,.075)}
.mark{display:grid;place-items:center;width:39px;height:39px;flex:0 0 auto;border:1px solid color-mix(in srgb,var(--ai-accent) 48%,rgba(255,255,255,.18));border-radius:13px;color:color-mix(in srgb,var(--ai-accent) 72%,white);background:color-mix(in srgb,var(--ai-accent) 25%,rgba(255,255,255,.08));font-size:20px}
.heading{display:flex;flex:1;flex-direction:column;gap:3px}.heading strong{font-size:14px;color:rgba(255,255,255,.96)}.heading span{font-size:10px;color:rgba(255,255,255,.43);letter-spacing:.04em}
.content{padding:20px 25px 22px}.meta{display:flex;align-items:center;flex-wrap:wrap;gap:8px;color:rgba(255,255,255,.43);font-size:10px;letter-spacing:.04em}.meta i{width:6px;height:6px;border-radius:50%;background:var(--ai-accent)}.generated{margin-left:auto;color:rgba(255,255,255,.32)}
.intro{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,220px);align-items:center;gap:18px;margin-top:18px}.title-block{min-width:0}.kicker{margin:0 0 9px;color:color-mix(in srgb,var(--ai-accent) 76%,#ddd);font-size:9px;font-weight:700;letter-spacing:.16em}.title-block h2{margin:0;color:#fff;font-size:34px;font-weight:720;line-height:1.22;letter-spacing:-.035em;overflow-wrap:anywhere}.subtitle{margin:9px 0 0;color:color-mix(in srgb,var(--ai-accent-2) 55%,rgba(255,255,255,.75));font-size:13px;line-height:1.65}
.preview{width:100%;max-width:220px;max-height:124px;aspect-ratio:16/9;margin:0;overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:12px;background:rgba(255,255,255,.045)}.preview img{display:block;width:100%;height:100%;max-height:124px;object-fit:cover}
.divider{display:flex;align-items:center;gap:5px;margin:21px 0 19px}.divider span:first-child{width:32px;height:2px;background:var(--ai-accent)}.divider span:nth-child(2){width:13px;height:2px;background:var(--ai-accent-2);opacity:.7}.divider span:nth-child(3){width:5px;height:2px;background:var(--ai-accent-3);opacity:.55}
.section+.section{margin-top:21px}.section-heading{display:flex;align-items:baseline;gap:9px;margin-bottom:9px}.index{color:color-mix(in srgb,var(--ai-accent) 70%,rgba(255,255,255,.42));font-family:monospace;font-size:10px}.section-heading h3{margin:0;color:rgba(255,255,255,.88);font-size:13px;font-weight:680}
.body{margin:0;color:rgba(241,242,246,.75);font-size:13px;line-height:2;white-space:pre-line;overflow-wrap:anywhere}.subsection+.subsection{margin-top:20px}.subheading{display:flex;align-items:center;gap:8px;margin:0 0 8px;color:rgba(255,255,255,.72);font-size:12px;font-weight:500;line-height:1.6;letter-spacing:.06em}.subheading:before{content:'';width:2px;height:12px;flex-shrink:0;border-radius:2px;background:var(--ai-accent)}
.highlight{margin-top:22px;padding:16px 15px 14px;border:1px solid color-mix(in srgb,var(--ai-accent) 22%,rgba(255,255,255,.06));border-radius:15px;background:rgba(255,255,255,.018)}.insight-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.highlighted{color:color-mix(in srgb,var(--ai-accent) 78%,white);font-size:13px;font-weight:700}.highlighted:before{width:3px;height:15px}.label{padding-left:11px;color:color-mix(in srgb,var(--ai-accent) 55%,rgba(255,255,255,.38));font-size:8px;font-weight:600;letter-spacing:.16em}.symbol{color:color-mix(in srgb,var(--ai-accent) 65%,white);font-size:17px}.body-highlight{margin-top:13px;color:rgba(241,242,246,.86)}.end{display:flex;justify-content:flex-end;margin-top:13px}.end span{width:34px;height:2px;border-radius:999px;background:var(--ai-accent)}
.tags{display:flex;flex-wrap:wrap;gap:8px}.tag{display:inline-flex;align-items:center;min-height:27px;padding:0 10px;border:1px solid rgba(255,255,255,.09);border-radius:999px;font-size:10px;line-height:1.4}.mood{border-color:color-mix(in srgb,var(--ai-accent) 28%,rgba(255,255,255,.1));color:color-mix(in srgb,var(--ai-accent) 52%,#f5f1ff);background:color-mix(in srgb,var(--ai-accent) 13%,rgba(255,255,255,.035))}.visual{color:rgba(255,255,255,.68);background:rgba(255,255,255,.045)}
.footer{display:flex;align-items:center;gap:7px;margin-top:23px;padding-top:13px;border-top:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.34);font-size:10px}.info{color:color-mix(in srgb,var(--ai-accent) 60%,#999)}
</style>
