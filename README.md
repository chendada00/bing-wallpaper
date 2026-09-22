# 🖼️ Bing Wallpaper（伴随·光影）

一个基于 **Vue 3 + Vite** 构建的 Bing 壁纸浏览器。

项目通过 [`bing-data`](https://github.com/chendada00/bing-data) 提供的结构化历史数据，展示 Bing 每日壁纸，并提供时间轴浏览、关键词搜索、颜色搜索、图片预览、原图查看、颜色提取与下载等功能。

> 🌏 在线体验：[`伴随·光影`](https://bing.伴随.cn)  
> 📦 数据仓库：[`bing-data`](https://github.com/chendada00/bing-data)

---

## ✨ 项目特性

- 🖼️ **Bing 每日壁纸浏览**
- 📅 **按时间轴浏览历史壁纸**
- 🔍 **关键词搜索**
- 🎨 **颜色搜索**
- 🌈 **基于图片主色调进行相似度匹配**
- ⚡ **按月份懒加载历史数据**
- 🧩 **缩略图 + 高清原图渐进式加载**
- 🖥️ **沉浸式图片查看器**
- ⬅️➡️ **上一张 / 下一张快速浏览**
- ⌨️ **键盘快捷键**
- 📋 **一键复制图片颜色**
- 💾 **下载原始壁纸**
- 📱 **移动端适配**
- 🚀 **适合部署到 Vercel 等静态托管平台**

---

## 🏗️ 技术栈

| 技术 | 用途 |
|---|---|
| 🟢 Vue 3 | 前端 UI 与组件化开发 |
| ⚡ Vite | 开发服务器与生产构建 |
| 📦 JavaScript | 项目主要开发语言 |
| 🎨 CSS | 页面布局、动画与响应式样式 |
| ☁️ Vercel | 项目部署 |
| 🗂️ JSON | Bing 壁纸历史数据 |
| 🖼️ Jimp | 数据仓库中的图片处理 |
| 🎨 node-vibrant | 图片主色提取 |

> 当前前端项目本身并不依赖 Tailwind CSS 或 Lucide Icons。README 中的技术栈以当前代码实际依赖为准。

---

# 🧭 项目结构

```text
bing-wallpaper/
├── public/
│   └── favicon.svg
│
├── src/
│   ├── components/
│   │   ├── EndState.vue
│   │   ├── ImageViewer.vue
│   │   ├── LoadingState.vue
│   │   ├── SearchPanel.vue
│   │   ├── Timeline.vue
│   │   └── WallpaperCard.vue
│   │
│   ├── composables/
│   │   ├── useBingData.js
│   │   └── useWallpaperSearch.js
│   │
│   ├── utils/
│   │   ├── colorSimilarity.js
│   │   └── date.js
│   │
│   ├── App.vue
│   ├── main.js
│   └── style.css
│
├── .env
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vercel.json
└── vite.config.js
```

---

# 🔄 数据架构

项目本身不负责抓取 Bing 数据。

整体架构可以理解为：

```text
                    ┌────────────────────┐
                    │      Bing API      │
                    └─────────┬──────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │      bing-data         │
                 │                        │
                 │ 数据抓取 / 图片处理     │
                 │ 缩略图 / 预览图         │
                 │ Base64 / 主色提取       │
                 │ 月度 JSON               │
                 └───────────┬────────────┘
                             │
                             │ JSON
                             ▼
                 ┌────────────────────────┐
                 │    bing-wallpaper      │
                 │                        │
                 │ Vue 3 + Vite           │
                 │ 数据加载                │
                 │ 搜索                    │
                 │ 时间轴                  │
                 │ 图片查看器              │
                 └────────────────────────┘
```

简单来说：

> **`bing-data` 负责生产数据，`bing-wallpaper` 负责消费和展示数据。**

---

# 📦 数据加载机制

前端通过：

```text
src/composables/useBingData.js
```

加载 `bing-data` 中的月度 JSON。

数据不是一次性全部加载，而是按照月份逐步加载，从而避免首次进入页面时直接请求大量历史数据。

基本流程：

```text
进入页面
   │
   ▼
加载当前月份
   │
   ▼
用户继续浏览
   │
   ▼
按需加载更早月份
   │
   ▼
合并数据
   │
   ▼
去重 / 标准化
   │
   ▼
交给 UI 展示
```

因此：

### ⚠️ 一个重要行为

**当前搜索是在浏览器已经加载的数据范围内进行的。**

也就是说：

> 搜索并不是直接查询整个 `bing-data` 仓库。

如果某个月份的数据还没有被加载进浏览器，那么这个月份的数据不会参与当前搜索。

同样，时间轴展示的范围也取决于当前已经加载的数据。

---

# 🔍 搜索

搜索逻辑位于：

```text
src/composables/useWallpaperSearch.js
```

支持两类主要搜索：

### 📝 文本搜索

可以匹配壁纸相关文本信息，例如：

- 标题
- 描述
- 日期等数据字段

### 🎨 颜色搜索

项目会利用数据中保存的颜色调色板进行匹配。

每张壁纸的数据包含：

```json
{
  "color": {
    "Vibrant": "#...",
    "DarkVibrant": "#...",
    "LightVibrant": "#...",
    "Muted": "#...",
    "DarkMuted": "#...",
    "LightMuted": "#..."
  }
}
```

当前颜色相似度实现基于 **HSV 色彩空间**进行计算。

> 注意：早期 README 中如果描述为 Lab 色彩空间，则已经过时。当前代码实际使用的是 HSV 相关逻辑。

---

# 🎨 图片颜色

图片颜色在 `bing-data` 生成阶段计算，而不是用户打开页面后临时计算。

这样做有几个好处：

- 🚀 前端无需重复分析图片
- 📦 JSON 中可以直接携带颜色信息
- 🔍 搜索时可以快速进行颜色匹配
- 🖼️ 图片查看器可以直接使用颜色生成背景

---

# 🖼️ 图片加载

图片展示采用渐进式加载思路。

大致流程：

```text
Base64 小缩略图
       │
       ▼
页面快速显示
       │
       ▼
加载高清图片
       │
       ▼
高清图片完成
       │
       ▼
切换到高清图片
```

图片查看器 `ImageViewer.vue` 对快速切换图片的场景做了额外处理。

例如：

```text
打开 A
 │
 ├── 开始加载 A 高清图
 │
 ▼
马上切换 B
 │
 ├── 开始加载 B 高清图
 │
 ▼
A 加载完成
 │
 └── 不覆盖当前 B
```

内部通过加载 token 等机制避免异步图片加载造成的竞态问题。

---

# 🔎 图片查看器

图片查看器位于：

```text
src/components/ImageViewer.vue
```

支持：

- 🖼️ 高清图片查看
- ⬅️ 上一张
- ➡️ 下一张
- ⌨️ `Esc` 关闭
- ⌨️ `←` 上一张
- ⌨️ `→` 下一张
- 🎨 图片主色展示
- 📋 复制颜色
- 💾 下载图片
- 📱 移动端适配

同时会根据图片提取到的颜色生成多层渐变背景，让高清图片加载过程中也保持较好的视觉效果。

---

# 🎨 调色板

支持的颜色类型包括：

```text
Vibrant
LightVibrant
DarkVibrant
Muted
LightMuted
DarkMuted
```

查看器会优先选择有效的颜色，并根据多个颜色生成背景渐变。

---

# 📥 下载

图片查看器提供图片下载能力。

正常情况下：

```text
图片 URL
   │
   ▼
fetch
   │
   ▼
Blob
   │
   ▼
Object URL
   │
   ▼
浏览器下载
```

如果浏览器环境或远程资源不允许直接下载，则会回退到打开原始图片地址。

---

# ⌨️ 快捷键

在图片查看器中：

| 按键 | 操作 |
|---|---|
| `Esc` | 关闭查看器 |
| `←` | 上一张 |
| `→` | 下一张 |

---

# 📅 时间轴

时间轴组件：

```text
src/components/Timeline.vue
```

时间轴并不是读取整个仓库后一次性生成。

它基于：

> **当前已经加载到前端的数据**

动态计算时间范围和日期。

因此，当用户继续加载更早月份时，时间轴也会随数据范围扩大。

---

# 🗂️ 数据格式

前端使用的月度数据结构类似：

```json
{
  "version": 1,
  "year": 2026,
  "month": 9,
  "updatedAt": "2026-09-21T19:51:02.041Z",
  "items": [
    {
      "date": "2026-09-01",
      "title": "...",
      "description": "...",
      "copyright": "...",
      "copyrightLink": "...",
      "image": "...",
      "preview": "...",
      "sourceImage": "...",
      "base64": "...",
      "color": {
        "Vibrant": "#...",
        "DarkVibrant": "#...",
        "LightVibrant": "#...",
        "Muted": "#...",
        "DarkMuted": "#...",
        "LightMuted": "#..."
      },
      "width": 1920,
      "height": 1080,
      "id": "...",
      "startDate": "...",
      "fullStartDate": "...",
      "endDate": "..."
    }
  ]
}
```

---

# 🚀 本地开发

## 1. 克隆项目

```bash
git clone https://github.com/chendada00/bing-wallpaper.git
cd bing-wallpaper
```

## 2. 安装依赖

```bash
npm install
```

## 3. 启动开发环境

```bash
npm run dev
```

然后访问 Vite 输出的本地地址。

---

# 🏗️ 构建

执行：

```bash
npm run build
```

构建结果默认输出到：

```text
dist/
```

本项目可以部署到：

- Vercel
- Nginx
- GitHub Pages
- 其他静态网站托管服务

---

# ☁️ Vercel

项目包含：

```text
vercel.json
```

可以直接将仓库导入 Vercel。

推荐配置：

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

具体配置以项目当前 Vercel 设置为准。

---

# ⚙️ 环境变量

项目包含：

```text
.env
```

如果部署环境需要额外的数据地址或运行配置，请根据当前 `.env` 与代码实际读取的变量进行配置。

不要将包含敏感信息的 `.env` 提交到公开仓库。

---

# 🧩 设计思路

这个项目刻意把：

```text
数据生产
```

和：

```text
数据展示
```

拆成两个仓库。

这样可以让前端保持轻量：

```text
Bing
 │
 ▼
bing-data
 │
 ├── 原图
 ├── Preview
 ├── Base64
 ├── 颜色
 └── JSON
       │
       ▼
bing-wallpaper
       │
       ├── 浏览
       ├── 搜索
       ├── 时间轴
       └── 查看器
```

前端不需要自己处理 Bing 图片抓取、图片压缩和颜色分析。

---

# ⚠️ 当前实现中的几个边界

### 1. 搜索不是全历史搜索

搜索范围 = **已经加载到浏览器的数据**。

如果需要真正的全历史搜索，需要进一步引入：

- 服务端索引
- 全量索引 JSON
- 搜索 API
- 或其他客户端索引方案

---

### 2. 时间轴不是全历史时间轴

时间轴同样依赖当前加载数据。

---

### 3. 数据仓库体积较大

`bing-data` 同时保存历史图片、Preview、Base64 和 JSON，因此仓库体积会随着时间持续增长。

前端项目本身不保存这些图片资源。

---

# 🤝 相关项目

📦 数据仓库：

https://github.com/chendada00/bing-data

🖼️ 前端项目：

https://github.com/chendada00/bing-wallpaper

---

# 📄 License

请以仓库实际 License 文件为准。

---

> 🌅 每一天的 Bing 壁纸，都是一段值得保存的风景。