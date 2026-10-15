'use strict';

import https from 'node:https';

const BING_API =
  'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';

const PUSHPLUS_API = 'https://www.pushplus.plus/send';
const MAX_HTML_LENGTH = 18000;

function loadTargets() {
  const raw = process.env.PUSHPLUS_TARGETS;

  if (!raw) throw new Error('未配置 PUSHPLUS_TARGETS');

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

    if (!token) throw new Error(`${name} 缺少 token`);

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
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 500)}`));
          return;
        }

        resolve(body);
      });
    });

    req.on('timeout', () => req.destroy(new Error('请求超时')));
    req.on('error', reject);

    if (options.body) req.write(options.body);
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
  if (!path) return 'https://www.bing.com/';

  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('//')) return `https:${path}`;

  return `https://www.bing.com${path.startsWith('/') ? '' : '/'}${path}`;
}

function formatDate(rawDate) {
  if (!/^\d{8}$/.test(String(rawDate || ''))) {
    throw new Error(`Bing 返回了无效日期：${rawDate}`);
  }

  return {
    iso: `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`,
    display: `${rawDate.slice(0, 4)}.${rawDate.slice(4, 6)}.${rawDate.slice(6, 8)}`,
  };
}

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
    title: image.title || 'Bing 每日壁纸',
    copyright: image.copyright || 'Bing Wallpaper',
    copyrightLink: image.copyrightlink
      ? toBingUrl(image.copyrightlink)
      : 'https://www.bing.com/',
    imageUrl: toBingUrl(image.url),
  };
}

function buildHtml(wallpaper) {
  const date = escapeHtml(wallpaper.date);
  const displayDate = escapeHtml(wallpaper.displayDate);
  const title = escapeHtml(wallpaper.title);
  const copyright = escapeHtml(wallpaper.copyright);
  const copyrightLink = escapeHtml(wallpaper.copyrightLink);
  const imageUrl = escapeHtml(wallpaper.imageUrl);

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Bing Wallpaper · ${date}</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:#101114}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#fff}
a{color:inherit;text-decoration:none}
.page{position:relative;min-height:100vh;overflow:hidden;background:#101114}
.scene{position:absolute;inset:0;overflow:hidden;background:#101114}
.scene-image{position:absolute;inset:-5%;width:110%;height:110%;object-fit:cover;filter:blur(48px) saturate(1.18);opacity:.42}
.scene-tint{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,${escapeHtml(wallpaper.color || '#52647A')}55,transparent 70%);opacity:.7}
.scene-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,6,9,.58),rgba(5,6,9,.12) 30%,rgba(5,6,9,.24) 65%,rgba(5,6,9,.94))}
.scene-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 28%,rgba(0,0,0,.24) 75%,rgba(0,0,0,.48))}
.content{position:relative;z-index:1;max-width:1180px;min-height:100vh;margin:auto;padding:28px 38px 24px;display:flex;flex-direction:column}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:16px}
.brand{font-size:13px;font-weight:700;letter-spacing:1.5px;color:#fff}
.brand span{font-weight:400;color:#c8d0dc}
.date-pill{padding:10px 15px;border:1px solid rgba(255,255,255,.24);border-radius:30px;background:rgba(20,22,27,.24);font-size:10px;letter-spacing:.04em;color:#e1e7ef}
.intro{margin:36px 0 22px}
.eyebrow{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#d1dbea;margin-bottom:14px}
h1{margin:0;color:#fff;font-size:clamp(27px,4vw,43px);line-height:1.3;font-weight:700;letter-spacing:-.03em;text-shadow:0 3px 25px rgba(0,0,0,.25)}
.sub{margin:10px 0 0;font-size:12px;line-height:1.8;color:#e1e7ef}
.hero{width:100%;max-width:850px;margin:0 auto;border:1px solid rgba(255,255,255,.16);border-radius:19px;overflow:hidden;background:rgba(17,23,32,.62);box-shadow:0 24px 70px rgba(0,0,0,.35)}
.photo-link{display:block;background:#1b2632}
.photo{display:block;width:100%;height:auto;max-height:520px;object-fit:cover;border:0}
.info{padding:23px 27px 25px;background:linear-gradient(140deg,rgba(29,42,56,.97),rgba(14,21,30,.98))}
.label{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#c0d2e7}
.caption{margin:10px 0 0;font-size:21px;line-height:1.55;font-weight:700;color:#fff;overflow-wrap:anywhere}
.copyright{margin:10px 0 0;font-size:12px;line-height:1.9;color:#d2dce8;overflow-wrap:anywhere}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.btn{display:inline-block;padding:12px 17px;border-radius:10px;font-size:12px;line-height:1.5;font-weight:650;text-align:center}
.primary{background:#f3f6fa;color:#17212e}
.secondary{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.04);color:#f3f6fa}
.note{max-width:850px;width:100%;margin:17px auto 0;display:flex;gap:10px;align-items:flex-start;font-size:11px;line-height:1.8;color:#d1dbea}
.dot{width:6px;height:6px;flex:0 0 6px;margin-top:7px;border-radius:50%;background:#a9c8ed}
.footer{max-width:850px;width:100%;margin:22px auto 0;padding-top:15px;border-top:1px solid rgba(255,255,255,.22);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:10px;letter-spacing:.08em;color:#c1cbd9}
@media(max-width:600px){.content{padding:18px 15px 20px}.intro{margin:30px 0 17px}.hero{border-radius:14px}.photo{max-height:none}.info{padding:19px 17px 20px}.caption{font-size:18px}.copyright{font-size:11px}.btn{padding:11px 12px}.note{font-size:10px}.date-pill{padding:8px 10px;font-size:9px}.brand{font-size:11px}}
</style>
</head>
<body>
<div class="page">
  <div class="scene" aria-hidden="true">
    <img class="scene-image" src="${imageUrl}" alt="">
    <div class="scene-tint"></div>
    <div class="scene-shade"></div>
    <div class="scene-vignette"></div>
  </div>

  <main class="content">
    <header class="topbar">
      <div class="brand">BING <span>WALLPAPER</span></div>
      <div class="date-pill">DAILY EDITION · ${date}</div>
    </header>

    <section class="intro">
      <div class="eyebrow">A MOMENT OF BEAUTY, EVERY DAY</div>
      <h1>今日的世界，值得一看。</h1>
      <p class="sub">${displayDate} · Bing 每日精选壁纸</p>
    </section>

    <article class="hero">
      <a class="photo-link" href="${imageUrl}" target="_blank" rel="noopener noreferrer">
        <img class="photo" src="${imageUrl}" alt="${title}">
      </a>

      <div class="info">
        <div class="label">TODAY'S HIGHLIGHT</div>
        <div class="caption">${title}</div>
        <p class="copyright">${copyright}</p>

        <div class="actions">
          <a class="btn primary" href="${imageUrl}" target="_blank" rel="noopener noreferrer">查看高清原图 ↗</a>
          <a class="btn secondary" href="${copyrightLink}" target="_blank" rel="noopener noreferrer">了解图片来源</a>
          <a class="btn secondary" href="https://bing.xn--xpqp35o.cn/" target="_blank" rel="noopener noreferrer" style="border-color:rgba(160,195,255,.55);background:rgba(105,150,220,.16);color:#e4edff;">探索更多每日壁纸 ↗</a>

        </div>
      </div>
    </article>

    <div class="note">
      <span class="dot"></span>
      <span>图片版权归原作者所有。此消息仅用于每日壁纸欣赏，图片由 Bing 官方图片服务提供。</span>
    </div>

    <footer class="footer">
      <span>Bing Daily Wallpaper</span>
      <span>ONE DAY · ONE PICTURE</span>
    </footer>
  </main>
</div>
</body>
</html>`;

  if (html.length > MAX_HTML_LENGTH) {
    throw new Error(`HTML 正文超出安全长度：${html.length} > ${MAX_HTML_LENGTH}`);
  }

  return html;
}

async function sendPushPlus(target, title, content) {
  const payload = {
    token: target.token,
    title,
    content,
    template: 'html',
  };

  if (target.topic) payload.topic = target.topic;

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
    throw new Error(`PushPlus 返回非 JSON 内容：${response.slice(0, 300)}`);
  }

  if (Number(result.code) !== 200) {
    throw new Error(`PushPlus 返回失败：code=${result.code}, msg=${result.msg || '未知错误'}`);
  }

  return result;
}

async function main() {
  const targets = loadTargets();
  console.log(`准备推送，目标数量：${targets.length}`);

  const wallpaper = await getTodayWallpaper();
  console.log(`Bing 壁纸日期：${wallpaper.date}`);
  console.log(`Bing 壁纸标题：${wallpaper.title}`);

  const html = buildHtml(wallpaper);
  console.log(`HTML 正文长度：${html.length} 字符`);

  const title = `Bing 每日壁纸 · ${wallpaper.date}`;

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
      console.error(`推送失败 [${targets[index].name}]：${result.reason.message}`);
    }
  });

  console.log(`推送结束：成功 ${results.length - failures}，失败 ${failures}`);

  if (failures > 0) {
    throw new Error(`${failures} 个推送目标失败，请查看日志`);
  }
}

main().catch(error => {
  console.error('Bing 每日壁纸推送任务失败：', error.message);
  process.exitCode = 1;
});
