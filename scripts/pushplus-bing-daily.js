
'use strict';

import https from 'node:https';

const BING_API =
  'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';

const DATA_BASE_URL =
  'https://raw.githubusercontent.com/chendada00/bing-data/main';

const PUSHPLUS_API = 'https://www.pushplus.plus/send';

// PushPlus 正文长度安全限制
const MAX_HTML_LENGTH = 19000;

// AI 正文最大长度，避免单条解读过长
const MAX_STORY_LENGTH = 900;

function loadTargets() {
  const raw = process.env.PUSHPLUS_TARGETS;

  if (!raw) {
    throw new Error('未配置 PUSHPLUS_TARGETS');
  }

  let targets;

  try {
    targets = JSON.parse(raw);
  } catch {
    throw new Error('PUSHPLUS_TARGETS 不是有效的 JSON');
  }

  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error('PUSHPLUS_TARGETS 必须是非空数组');
  }

  const seen = new Set();

  return targets.map((target, index) => {
    if (!target || typeof target !== 'object' || Array.isArray(target)) {
      throw new Error(`第 ${index + 1} 个推送目标格式错误`);
    }

    const name = String(target.name || `目标${index + 1}`).trim();
    const token = String(target.token || '').trim();
    const topic = String(target.topic || '').trim();

    if (!token) {
      throw new Error(`${name} 缺少 token`);
    }

    const key = `${token}\n${topic}`;

    if (seen.has(key)) {
      console.log(`跳过重复目标：${name}`);
      return null;
    }

    seen.add(key);

    return { name, token, topic };
  }).filter(Boolean);
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(new URL(url), {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000,
    }, (res) => {
      const chunks = [];

      res.on('data', chunk => chunks.push(chunk));

      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(
            new Error(
              `HTTP ${res.statusCode}: ${body.slice(0, 500)}`
            )
          );
          return;
        }

        resolve(body);
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('请求超时'));
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toBingUrl(path) {
  if (!path) {
    return 'https://www.bing.com/';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith('//')) {
    return `https:${path}`;
  }

  return `https://www.bing.com${path.startsWith('/') ? '' : '/'}${path}`;
}

function safeHttpsUrl(value, fallback = '') {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  try {
    const url = new URL(value);

    return url.protocol === 'https:'
      ? url.href
      : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(rawDate) {
  if (!/^\d{8}$/.test(String(rawDate || ''))) {
    throw new Error(`Bing 返回了无效日期：${rawDate}`);
  }

  return {
    iso: `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`,
    display: `${rawDate.slice(0, 4)}.${rawDate.slice(4, 6)}.${rawDate.slice(6, 8)}`,
    year: rawDate.slice(0, 4),
    month: rawDate.slice(4, 6),
  };
}

/**
 * 获取 Bing 当天壁纸。
 */
async function getTodayWallpaper() {
  const response = await request(BING_API);

  let data;

  try {
    data = JSON.parse(response);
  } catch {
    throw new Error('无法解析 Bing 官方接口返回的 JSON');
  }

  const image = data.images?.[0];

  if (!image?.url || !image?.enddate) {
    throw new Error('Bing 官方接口未返回有效的当天壁纸');
  }

  const date = formatDate(image.enddate);

  return {
    date: date.iso,
    displayDate: date.display,
    year: date.year,
    month: date.month,
    title: image.title || 'Bing 每日壁纸',
    copyright: image.copyright || 'Bing Wallpaper',
    copyrightLink: image.copyrightlink
      ? toBingUrl(image.copyrightlink)
      : 'https://www.bing.com/',
    imageUrl: toBingUrl(image.url),
  };
}

/**
 * 根据 Bing 日期读取 bing-data 对应月份的数据。
 *
 * 例如：
 * data/2026/11.json
 */
async function getWallpaperData(wallpaper) {
  const url =
    `${DATA_BASE_URL}/data/${wallpaper.year}/${wallpaper.month}.json`;

  try {
    const response = await request(url, {
      headers: {
        'User-Agent': 'Bing-Wallpaper-PushPlus/1.0',
      },
    });

    const data = JSON.parse(response);

    if (!Array.isArray(data.items)) {
      throw new Error('月度 JSON 中不存在 items 数组');
    }

    const item = data.items.find(
      entry => entry.date === wallpaper.date
    );

    if (!item) {
      console.warn(`bing-data 中没有找到 ${wallpaper.date} 的记录`);
      return null;
    }

    console.log(`成功读取壁纸数据：${wallpaper.date}`);

    return item;
  } catch (error) {
    console.warn(
      `读取 bing-data 失败，将使用 Bing 官方数据继续推送：${error.message}`
    );

    return null;
  }
}

/**
 * 规范化标签。
 */
function normalizeTags(value, max = 4) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(item => typeof item === 'string' && item.trim())
    .map(item => item.trim())
    .slice(0, max);
}

/**
 * 获取图片主题色。
 */
function getPalette(item) {
  const colors = item?.color || {};

  const candidates = [
    colors.Vibrant,
    colors.LightVibrant,
    colors.DarkVibrant,
    colors.Muted,
    colors.LightMuted,
    colors.DarkMuted,
  ];

  const palette = candidates.filter(
    color => typeof color === 'string' &&
      /^#[0-9a-fA-F]{6}$/.test(color)
  );

  return {
    accent: palette[0] || '#9588df',
    accent2: palette[1] || '#c2a2dc',
    accent3: palette[2] || '#86a9b7',
  };
}

/**
 * 截断过长的 AI 正文。
 */
function truncateStory(value, maxLength = MAX_STORY_LENGTH) {
  if (typeof value !== 'string') {
    return '';
  }

  const story = value.trim();

  if (story.length <= maxLength) {
    return story;
  }

  return `${story.slice(0, maxLength).trim()}……`;
}

/**
 * 组合壁纸和 AI 解读数据。
 */
function mergeWallpaperData(wallpaper, item) {
  if (!item) {
    return {
      ...wallpaper,
      aiStory: null,
      previewUrl: wallpaper.imageUrl,
      palette: getPalette(null),
    };
  }

  const aiStory =
    item.aiStory && typeof item.aiStory === 'object'
      ? item.aiStory
      : null;

  const previewUrl = safeHttpsUrl(
    item.preview,
    wallpaper.imageUrl
  );

  return {
    ...wallpaper,

    title: item.title || wallpaper.title,

    copyright: item.copyright || wallpaper.copyright,

    copyrightLink: safeHttpsUrl(
      item.copyrightLink,
      wallpaper.copyrightLink
    ),

    previewUrl,

    aiStory: aiStory
      ? {
          title: aiStory.title || item.title || '这一刻的风景',
          subtitle: aiStory.subtitle || '',
          story: truncateStory(aiStory.story),
          mood: normalizeTags(aiStory.mood),
          visualElements: normalizeTags(aiStory.visualElements),
          generatedAt: aiStory.generatedAt || '',
        }
      : null,

    palette: getPalette(item),
  };
}

/**
 * 生成 AI 解读卡片 HTML。
 *
 * 视觉结构参考前端 AiStoryPanel.vue：
 * - 深色渐变卡片
 * - 顶部 AI 标识
 * - 日期信息
 * - 标题和副标题
 * - 图片预览
 * - 意境漫游
 * - 心境回声
 * - 细节之诗
 * - AI 生成说明
 */
function buildHtml(wallpaper) {
  const {
    date,
    displayDate,
    title,
    copyright,
    copyrightLink,
    imageUrl,
    previewUrl,
    aiStory,
    palette,
  } = wallpaper;

  const accent = palette.accent;
  const accent2 = palette.accent2;
  const accent3 = palette.accent3;

  const safeDate = escapeHtml(date);
  const safeDisplayDate = escapeHtml(displayDate);
  const safeTitle = escapeHtml(title);
  const safeCopyright = escapeHtml(copyright);
  const safeCopyrightLink = escapeHtml(copyrightLink);
  const safeImageUrl = escapeHtml(imageUrl);
  const safePreviewUrl = escapeHtml(previewUrl);

  const hasStory = Boolean(
    aiStory &&
    typeof aiStory.story === 'string' &&
    aiStory.story.trim()
  );

  const storyTitle = escapeHtml(
    aiStory?.title || title
  );

  const subtitle = escapeHtml(
    aiStory?.subtitle || ''
  );

  const story = escapeHtml(
    aiStory?.story || ''
  );

  const generatedAt = aiStory?.generatedAt
    ? escapeHtml(
        String(aiStory.generatedAt).slice(0, 10)
      )
    : '';

  const moodTags = (aiStory?.mood || [])
    .map(tag => `
      <span class="tag mood">${escapeHtml(tag)}</span>
    `)
    .join('');

  const visualTags = (aiStory?.visualElements || [])
    .map(tag => `
      <span class="tag visual">${escapeHtml(tag)}</span>
    `)
    .join('');

  const storyContent = hasStory
    ? `
      <div class="divider">
        <span></span><span></span><span></span>
      </div>

      <section class="section">
        <div class="section-heading">
          <span class="index">01</span>
          <span class="section-title">意境漫游</span>
        </div>
        <div class="story">${story}</div>
      </section>

      ${moodTags ? `
        <section class="section">
          <div class="section-heading">
            <span class="index">02</span>
            <span class="section-title">心境回声</span>
          </div>
          <div class="tags">${moodTags}</div>
        </section>
      ` : ''}

      ${visualTags ? `
        <section class="section">
          <div class="section-heading">
            <span class="index">03</span>
            <span class="section-title">细节之诗</span>
          </div>
          <div class="tags">${visualTags}</div>
        </section>
      ` : ''}

      <div class="ai-footer">
        ${generatedAt ? `<span class="generated">生成于 ${generatedAt}</span>` : ''}
      </div>
    `
    : `
      <div class="divider">
        <span></span><span></span><span></span>
      </div>
      <div class="empty-story">
        今日 AI 解读暂未生成，先欣赏这幅风景吧。
      </div>
    `;

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${storyTitle} · ${safeDate}</title>
<style>
*{box-sizing:border-box}
html,body{
  margin:0;
  padding:0;
  background:#101116;
  color:#f7f7fa;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
}
body{padding:18px 10px}
a{color:inherit;text-decoration:none}
.container{
  width: 100%;
  max-width: 560px; /* 手机端最大 560 */
  margin:0 auto;
  overflow:hidden;
  border:1px solid rgba(255,255,255,.14);
  border-radius:20px;
  background:linear-gradient(145deg,#23252d,#12141b 72%);
  box-shadow:0 18px 55px rgba(0,0,0,.35);
}
.accent-line{
  height:2px;
  margin:0 8%;
  background:linear-gradient(90deg,transparent,${accent},${accent2},${accent3},transparent);
}
.header{
  display:flex;
  align-items:center;
  gap:11px;
  padding:19px 20px 16px;
  border-bottom:1px solid rgba(255,255,255,.075);
}
.mark{
  display:flex;
  align-items:center;
  justify-content:center;
  width:39px;
  height:39px;
  flex:0 0 39px;
  border:1px solid ${accent}88;
  border-radius:13px;
  color:${accent2};
  background:${accent}22;
  font-size:21px;
}
.heading{flex:1;min-width:0}
.heading strong{
  display:block;
  color:#fff;
  font-size:14px;
  font-weight:700;
}
.heading small{
  display:block;
  margin-top:4px;
  color:rgba(255,255,255,.43);
  font-size:10px;
  letter-spacing:.04em;
}
.date{
  color:rgba(255,255,255,.48);
  font-size:10px;
  white-space:nowrap;
}
.content{padding:19px 21px 21px}
.meta{
  display:flex;
  align-items:center;
  gap:8px;
  color:rgba(255,255,255,.46);
  font-size:10px;
  letter-spacing:.04em;
}
.date-dot{
  width:6px;
  height:6px;
  border-radius:50%;
  background:${accent};
  box-shadow:0 0 10px ${accent};
}
.kicker{
  margin:20px 0 9px;
  color:${accent2};
  font-size:9px;
  font-weight:700;
  letter-spacing:.15em;
}
h1{
  margin:0;
  color:#fff;
  font-size:27px;
  font-weight:720;
  line-height:1.3;
  letter-spacing:-.025em;
}
.subtitle{
  margin:8px 0 0;
  color:#c2a2dc;
  font-size:12px;
  line-height:1.7;
}
.preview{
  display:block;
  width:100%;
  max-height:230px;
  margin:17px 0 0;
  overflow:hidden;
  border:1px solid rgba(255,255,255,.13);
  border-radius:13px;
  background:#252936;
}
.preview img{
  display:block;
  width:100%;
  max-height:230px;
  object-fit:cover;
}
.divider{
  display:flex;
  align-items:center;
  gap:5px;
  margin:21px 0 19px;
}
.divider span:nth-child(1){
  width:32px;
  height:2px;
  border-radius:2px;
  background:${accent};
}
.divider span:nth-child(2){
  width:13px;
  height:2px;
  border-radius:2px;
  background:${accent2};
}
.divider span:nth-child(3){
  width:5px;
  height:2px;
  border-radius:2px;
  background:${accent3};
}
.section{margin-top:19px}
.section-heading{
  display:flex;
  align-items:baseline;
  gap:9px;
  margin-bottom:9px;
}
.index{
  color:${accent};
  font-family:monospace;
  font-size:10px;
  letter-spacing:.06em;
}
.section-title{
  color:rgba(255,255,255,.9);
  font-size:13px;
  font-weight:680;
}
.story{
  color:rgba(241,242,246,.78);
  font-size:13px;
  line-height:1.95;
  white-space:pre-line;
  overflow-wrap:anywhere;
}
.tags{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
}
.tag{
  display:inline-block;
  padding:6px 10px;
  border:1px solid rgba(255,255,255,.1);
  border-radius:30px;
  font-size:10px;
  line-height:1.4;
}
.mood{
  border-color:${accent}55;
  color:#e2d9ff;
  background:${accent}20;
}
.visual{
  color:rgba(255,255,255,.72);
  background:rgba(255,255,255,.045);
}
.ai-footer{
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:6px;
  margin-top:23px;
  padding-top:13px;
  border-top:1px solid rgba(255,255,255,.075);
  color:rgba(255,255,255,.38);
  font-size:10px;
}
.footer-icon{color:${accent2}}
.generated{margin-left:auto}
.empty-story{
  color:rgba(255,255,255,.58);
  font-size:12px;
  line-height:1.8;
}
.copyright{
  margin-top:17px;
  padding-top:13px;
  border-top:1px solid rgba(255,255,255,.07);
  color:rgba(255,255,255,.38);
  font-size:10px;
  line-height:1.7;
}
.actions{
  display:flex;
  flex-wrap:wrap;
  gap:9px;
  margin-top:16px;
}
.btn{
  display:inline-block;
  padding:10px 13px;
  border:1px solid rgba(255,255,255,.16);
  border-radius:9px;
  color:#eee;
  background:rgba(255,255,255,.06);
  font-size:11px;
  font-weight:600;
}
.btn.primary{
  border-color:#fff;
  color:#20232b;
  background:#f3f4f7;
}
.bottom{
  padding:13px 20px;
  border-top:1px solid rgba(255,255,255,.07);
  color:rgba(255,255,255,.28);
  font-size:9px;
  letter-spacing:.08em;
  text-align:center;
}
@media(min-width: 768px) {
  body { padding: 30px 20px; }
  .container {
    max-width: 800px; /* 电脑端撑开到 800px，画面会丰满很多 */
    border-radius: 24px;
  }
  .preview, .preview img {
    max-height: 400px; /* 电脑端图片也可以更高一些，更好看 */
  }
}
@media(max-width:420px){
  body{padding:8px 5px}
  .container{border-radius:15px}
  .header{padding:16px}
  .content{padding:17px}
  h1{font-size:24px}
  .story{font-size:12px;line-height:1.9}
  .date{font-size:9px}
}
</style>
</head>
<body>
<div class="container">
  <div class="accent-line"></div>

  <header class="header">
    <div class="mark">✧</div>
    <div class="heading">
      <strong>灵感视界</strong>
      <small>画面的无声回响</small>
    </div>
    <div class="date">${safeDate}</div>
  </header>

  <main class="content">
    <div class="meta">
      <span class="date-dot"></span>
      <span>${safeDisplayDate}</span>
    </div>

    <div class="kicker">A LITTLE STORY BEHIND THE VIEW</div>
    <h1>${storyTitle}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}

    <a class="preview" href="${safeImageUrl}" target="_blank">
      <img src="${safePreviewUrl}" alt="${safeTitle}">
    </a>

    ${storyContent}

    <div class="copyright">
      ${safeCopyright}
    </div>

    <div class="actions">
      <a class="btn primary" href="${safeImageUrl}" target="_blank">
        查看高清原图 ↗
      </a>
      <a class="btn" href="${safeCopyrightLink}" target="_blank">
        图片来源 ↗
      </a>
      <a class="btn" href="https://bing.xn--xpqp35o.cn/" target="_blank">
        探索更多壁纸 ↗
      </a>
    </div>
  </main>

  <footer class="bottom">
    BING WALLPAPER · ONE DAY · ONE PICTURE
  </footer>
</div>
</body>
</html>`;

  if (html.length > MAX_HTML_LENGTH) {
    throw new Error(
      `HTML 正文超出安全长度：${html.length} > ${MAX_HTML_LENGTH}`
    );
  }

  return html;
}

/**
 * 推送 PushPlus。
 */
async function sendPushPlus(target, title, content) {
  const payload = {
    token: target.token,
    title,
    content,
    template: 'html',
  };

  if (target.topic) {
    payload.topic = target.topic;
  }

  const body = JSON.stringify(payload);

  const response = await request(PUSHPLUS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  });

  let result;

  try {
    result = JSON.parse(response);
  } catch {
    throw new Error(
      `PushPlus 返回非 JSON 内容：${response.slice(0, 300)}`
    );
  }

  if (Number(result.code) !== 200) {
    throw new Error(
      `PushPlus 返回失败：code=${result.code}, msg=${result.msg || '未知错误'}`
    );
  }

  return result;
}

/**
 * 主流程。
 */
async function main() {
  const targets = loadTargets();

  console.log(`准备推送，目标数量：${targets.length}`);

  // 1. 获取 Bing 当天壁纸
  const bingWallpaper = await getTodayWallpaper();

  console.log(`Bing 壁纸日期：${bingWallpaper.date}`);
  console.log(`Bing 壁纸标题：${bingWallpaper.title}`);

  // 2. 从 bing-data 获取 AI 解读
  const dataItem = await getWallpaperData(bingWallpaper);

  if (dataItem?.aiStory?.story) {
    console.log('当天 AI 解读已找到');
  } else {
    console.log('当天没有可用的 AI 解读，将推送普通壁纸卡片');
  }

  // 3. 合并数据
  const wallpaper = mergeWallpaperData(
    bingWallpaper,
    dataItem
  );

  // 4. 生成 HTML
  const html = buildHtml(wallpaper);

  console.log(`HTML 正文长度：${html.length} 字符`);

  const title = wallpaper.aiStory
    ? `${wallpaper.aiStory.title} · ${wallpaper.date} · ${wallpaper.title}`
    : `Bing 每日壁纸 · ${wallpaper.date}`;

  // 5. 多目标推送
  const results = await Promise.allSettled(
    targets.map(async target => {
      console.log(`开始推送：${target.name}`);

      await sendPushPlus(target, title, html);

      console.log(`推送请求成功：${target.name}`);
    })
  );

  let failures = 0;

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failures++;

      console.error(
        `推送失败 [${targets[index].name}]：${result.reason.message}`
      );
    }
  });

  console.log(
    `推送结束：成功 ${results.length - failures}，失败 ${failures}`
  );

  if (failures > 0) {
    throw new Error(`${failures} 个推送目标失败，请查看日志`);
  }
}

main().catch(error => {
  console.error(
    'Bing 每日壁纸推送任务失败：',
    error.message
  );

  process.exitCode = 1;
});
