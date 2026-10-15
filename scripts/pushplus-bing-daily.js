
'use strict';

const https = require('https');

const BING_API =
  'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';

const PUSHPLUS_API = 'https://www.pushplus.plus/send';
const MAX_HTML_LENGTH = 18000;

/**
 * PUSHPLUS_TARGETS 是一个 JSON 数组。
 *
 * 个人推送：
 * { "name": "个人", "token": "个人Token" }
 *
 * 群组推送：
 * { "name": "摄影群", "token": "个人Token", "topic": "群组编码" }
 */
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
    if (!target || typeof target !== 'object') {
      throw new Error(`第 ${index + 1} 个推送目标格式错误`);
    }

    const name = String(target.name || `目标${index + 1}`).trim();
    const token = String(target.token || '').trim();
    const topic = String(target.topic || '').trim();

    if (!token) {
      throw new Error(`${name} 缺少 token`);
    }

    // 同一个 token + topic 只推送一次，避免配置重复。
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
    const target = new URL(url);

    const req = https.request(target, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000,
    }, (res) => {
      const chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));

      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(
            `HTTP ${res.statusCode}: ${body.slice(0, 500)}`
          ));
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
  if (!path) return '';

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith('//')) {
    return `https:${path}`;
  }

  return `https://www.bing.com${path.startsWith('/') ? '' : '/'}${path}`;
}

function formatDate(rawDate) {
  if (!/^\d{8}$/.test(String(rawDate || ''))) {
    throw new Error(`Bing 返回了无效日期：${rawDate}`);
  }

  const year = rawDate.slice(0, 4);
  const month = rawDate.slice(4, 6);
  const day = rawDate.slice(6, 8);

  return {
    iso: `${year}-${month}-${day}`,
    display: `${year}.${month}.${day}`,
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

  if (!image || !image.url || !image.enddate) {
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
    imagePage: 'https://www.bing.com/',
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
<title>Bing 每日壁纸 · ${date}</title>
<style>
*{box-sizing:border-box}
html{background:#0b1018}
body{margin:0;padding:22px 14px 30px;background:radial-gradient(ellipse at 50% 0%,#243447 0,#111923 48%,#090d13 100%);color:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
a{color:inherit;text-decoration:none}
.page{max-width:760px;margin:0 auto}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 22px}
.brand{font-size:14px;font-weight:700;letter-spacing:1.4px}
.brand span{color:#9caec3;font-weight:400}
.pill{font-size:11px;color:#c8d5e5;border:1px solid #344456;border-radius:30px;padding:7px 11px;white-space:nowrap}
.intro{margin:0 0 18px}
.eyebrow{font-size:11px;letter-spacing:3px;color:#9fb7d0;text-transform:uppercase}
h1{font-size:clamp(25px,5vw,38px);line-height:1.25;letter-spacing:-.6px;margin:10px 0 9px;font-weight:750}
.sub{font-size:13px;line-height:1.8;color:#a8b4c4;margin:0}
.hero{overflow:hidden;border:1px solid #354353;border-radius:18px;background:#111923;box-shadow:0 24px 65px #0007}
.photo{display:block;width:100%;height:auto;max-height:560px;object-fit:cover;background:#1b2632}
.info{padding:20px 20px 18px;background:linear-gradient(140deg,#1b2734,#111923 75%)}
.label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#90a5bc}
.caption{font-size:18px;line-height:1.65;font-weight:650;margin:8px 0 0;overflow-wrap:anywhere}
.copyright{font-size:12px;line-height:1.8;color:#aab8c8;margin:9px 0 0;overflow-wrap:anywhere}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.btn{display:inline-block;text-align:center;border-radius:10px;padding:12px 16px;font-size:13px;font-weight:650}
.primary{background:#f3f6fa;color:#111923}
.secondary{border:1px solid #425166;color:#dbe5ef}
.note{display:flex;gap:12px;align-items:flex-start;padding:17px 2px 0;color:#8797aa;font-size:11px;line-height:1.8}
.dot{width:6px;height:6px;flex:0 0 6px;margin-top:7px;border-radius:50%;background:#93b6dc}
.footer{border-top:1px solid #293544;margin-top:23px;padding-top:17px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:11px;color:#78899d}
@media(min-width:600px){body{padding-top:38px}.info{padding:25px 28px 24px}.top{margin-bottom:32px}}
</style>
</head>
<body>
<main class="page">
  <header class="top">
    <div class="brand">BING <span>WALLPAPER</span></div>
    <div class="pill">DAILY EDITION · ${date}</div>
  </header>
  <section class="intro">
    <div class="eyebrow">A moment of beauty, every day</div>
    <h1>今日的世界，值得一看。</h1>
    <p class="sub">${displayDate} · Bing 每日精选壁纸</p>
  </section>
  <article class="hero">
    <a href="${imageUrl}" target="_blank" rel="noopener noreferrer">
      <img class="photo" src="${imageUrl}" alt="${title}" fetchpriority="high">
    </a>
    <div class="info">
      <div class="label">TODAY'S HIGHLIGHT</div>
      <div class="caption">${title}</div>
      <p class="copyright">${copyright}</p>
      <div class="actions">
        <a class="btn primary" href="${imageUrl}" target="_blank" rel="noopener noreferrer">查看高清原图 ↗</a>
        <a class="btn secondary" href="${copyrightLink}" target="_blank" rel="noopener noreferrer">了解图片来源</a>
      </div>
    </div>
  </article>
  <div class="note">
    <span class="dot"></span>
    <span>图片版权归原作者所有。此邮件/消息仅用于每日壁纸欣赏，图片由 Bing 官方图片服务提供。</span>
  </div>
  <footer class="footer">
    <span>Bing Daily Wallpaper</span>
    <span>ONE DAY · ONE PICTURE</span>
  </footer>
</main>
</body>
</html>`;

  // PushPlus 对正文有长度限制。留出足够余量，避免接近上限。
  if (html.length > MAX_HTML_LENGTH) {
    throw new Error(
      `HTML 正文超出安全长度：${html.length} > ${MAX_HTML_LENGTH}`
    );
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
    throw new Error(`PushPlus 返回非 JSON 内容：${response.slice(0, 300)}`);
  }

  if (Number(result.code) !== 200) {
    throw new Error(
      `PushPlus 返回失败：code=${result.code}, msg=${result.msg || '未知错误'}`
    );
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
    targets.map(async (target) => {
      console.log(`开始推送：${target.name}`);

      await sendPushPlus(target, title, html);

      console.log(`推送请求成功：${target.name}`);
      return target.name;
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

main().catch((error) => {
  console.error('Bing 每日壁纸推送任务失败：', error.message);
  process.exitCode = 1;
});
