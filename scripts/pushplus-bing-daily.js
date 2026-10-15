'use strict';

import https from 'node:https';

const BING_API =
  'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';

const PUSHPLUS_API = 'https://www.pushplus.plus/send';
const MAX_HTML_LENGTH = 18000;

/**
 * PUSHPLUS_TARGETS 配置示例：
 *
 * [
 *   {"name":"个人微信","token":"个人Token"},
 *   {"name":"壁纸交流群","token":"个人Token","topic":"群组编码"}
 * ]
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

    req.on('timeout', () => req.destroy(new Error('请求超时')));
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
<title>Bing 每日壁纸 · ${date}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f6;color:#1f2937;font-family:Arial,'Microsoft YaHei',sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="width:100%;background-color:#eef2f6;">
<tr>
<td align="center" style="padding:24px 12px;">

<table role="presentation" width="720" cellpadding="0" cellspacing="0" border="0"
       style="width:100%;max-width:720px;background-color:#ffffff;border:1px solid #dce3eb;border-radius:12px;">

<tr>
<td style="padding:24px 22px 18px;border-bottom:1px solid #e5e7eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="font-size:14px;font-weight:bold;letter-spacing:1px;color:#26364a;">
      BING WALLPAPER
    </td>
    <td align="right" style="font-size:11px;color:#475569;">
      DAILY EDITION · ${date}
    </td>
  </tr>
  </table>

  <p style="margin:25px 0 8px;font-size:11px;letter-spacing:2px;color:#64748b;">
    A MOMENT OF BEAUTY, EVERY DAY
  </p>

  <h1 style="margin:0 0 10px;font-size:28px;line-height:1.5;font-weight:bold;color:#172033;">
    今日的世界，值得一看。
  </h1>

  <p style="margin:0;font-size:13px;line-height:1.8;color:#475569;">
    ${displayDate} · Bing 每日精选壁纸
  </p>
</td>
</tr>

<tr>
<td style="padding:20px 20px 0;">
  <a href="${imageUrl}" target="_blank" style="text-decoration:none;">
    <img src="${imageUrl}" alt="${title}" width="680"
         style="display:block;width:100%;max-width:680px;height:auto;border:0;border-radius:8px;background-color:#e2e8f0;">
  </a>
</td>
</tr>

<tr>
<td style="padding:20px 22px 24px;background-color:#17212e;color:#ffffff;">

  <p style="margin:0 0 10px;font-size:10px;letter-spacing:2px;color:#b9cce0;">
    TODAY'S HIGHLIGHT
  </p>

  <h2 style="margin:0;font-size:20px;line-height:1.6;font-weight:bold;color:#ffffff;">
    ${title}
  </h2>

  <p style="margin:12px 0 20px;font-size:13px;line-height:1.9;color:#e2e8f0;overflow-wrap:anywhere;">
    ${copyright}
  </p>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td bgcolor="#ffffff" style="border-radius:6px;">
      <a href="${imageUrl}" target="_blank"
         style="display:inline-block;padding:12px 16px;font-size:13px;font-weight:bold;color:#17212e;text-decoration:none;">
        查看高清原图 ↗
      </a>
    </td>
    <td width="10"></td>
    <td style="border:1px solid #8b9bad;border-radius:6px;">
      <a href="${copyrightLink}" target="_blank"
         style="display:inline-block;padding:11px 15px;font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none;">
        了解图片来源
      </a>
    </td>
  </tr>
  </table>

</td>
</tr>

<tr>
<td style="padding:16px 22px 8px;font-size:12px;line-height:1.9;color:#475569;">
  ● 图片版权归原作者所有。此消息仅用于每日壁纸欣赏，图片由 Bing 官方图片服务提供。
</td>
</tr>

<tr>
<td style="padding:12px 22px 22px;font-size:11px;color:#64748b;border-top:1px solid #e5e7eb;">
  Bing Daily Wallpaper &nbsp; | &nbsp; ONE DAY · ONE PICTURE
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>`;

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
