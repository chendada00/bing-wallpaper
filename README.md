<div align="center">

# 🖼️ Bing Wallpaper

**Bing 每日壁纸收藏、浏览、搜索与色彩探索**

[![Vue
3](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **在线网站：** [bing.伴随.cn](https://bing.伴随.cn)  
🗂️ **壁纸数据：** [bing-data.伴随.cn](https://bing-data.伴随.cn)  
🖥️ **UHD 高清图片：** [bing-uhd.伴随.cn](https://bing-uhd.伴随.cn)

</div>

------------------------------------------------------------------------

## ✨ 项目简介

`bing-wallpaper` 是 Bing 每日壁纸收藏系统的前端网站，基于 Vue 3 与 Vite
构建，采用静态部署方式。前端、结构化数据和 UHD
高清原图分别存放在独立仓库，方便维护、缓存和扩展。

整个系统由三个仓库组成：

| 仓库                                                             | 职责                                               |
|------------------------------------------------------------------|----------------------------------------------------|
| [`bing-wallpaper`](https://github.com/chendada00/bing-wallpaper) | 前端页面、搜索、详情页、SEO                        |
| [`bing-data`](https://github.com/chendada00/bing-data)           | 月度 JSON、历史索引、预览图、Base64 与颜色分析数据 |
| [`bing-uhd`](https://github.com/chendada00/bing-uhd)             | UHD 高清图片镜像                                   |

## 🚀 功能一览

- 🗓️ 按日期浏览每日壁纸，并按月份加载历史内容
- 🔎 关键词搜索、日期搜索与全历史搜索
- 🎨 主色调展示与颜色搜索
- 🌈 首页色彩指纹与详情页 HSV 颜色分布图
- 🖼️ 壁纸独立详情页与高清查看入口
- ⬇️ 高清图片查看与下载
- ⚡ 使用预览图和 Base64 模糊占位，改善首屏加载体验
- 📱 适配桌面端与移动端
- 🔔 通知提示组件，支持链接、手动关闭与自动关闭
- 🔍 自动生成 `sitemap.xml` 与 `robots.txt`
- 🧭 为单张壁纸生成独立 URL，便于搜索引擎发现

## 🧩 三个仓库如何协作

``` text
Bing 每日壁纸
      │
      ▼
┌─────────────────────┐
│      bing-data      │
│ 月度 JSON / 索引     │
│ preview / Base64    │
│ 主色调 / HSV 直方图  │
└──────────┬──────────┘
           │ 提供数据与预览资源
           ▼
┌─────────────────────┐       ┌─────────────────────┐
│   bing-wallpaper    │──────▶│       bing-uhd      │
│     Vue 前端网站     │ 高清图 │     UHD 图片镜像     │
└─────────────────────┘       └─────────────────────┘
```

- **前端：** `https://bing.伴随.cn`
- **数据：** `https://bing-data.伴随.cn`
- **UHD：** `https://bing-uhd.伴随.cn`

## 🖼️ 图片加载策略

不同页面场景使用不同尺寸的资源，避免首页一次性加载大量 UHD 原图。

| 字段          | 用途                                                         |
|---------------|--------------------------------------------------------------|
| `preview`     | 首页卡片和普通浏览使用的预览图                               |
| `base64`      | 小尺寸 JPEG 的 Base64 数据，用于模糊占位及首页背景等视觉效果 |
| `sourceImage` | Bing 官方 UHD 原图地址                                       |
| `image`       | 项目维护的 UHD 高清镜像地址                                  |

典型加载逻辑：

``` text
首页卡片
  └─ preview / base64 占位

详情页或高清查看
  ├─ 优先尝试 sourceImage（官方 UHD）
  └─ 官方资源不可用时回退到 image（项目 UHD 镜像）
```

实际回退行为以对应页面组件实现为准。`base64` 是小尺寸占位资源，不是 UHD
原图，也不应作为高清下载地址。

## 🗂️ 数据加载与历史搜索

默认数据源为：

``` text
https://bing-data.伴随.cn
```

数据按年份和月份拆分：

``` text
data/
├── index.json
├── 2026/
│   ├── 01.json
│   ├── 02.json
│   └── ...
└── 2025/
    └── ...
```

普通浏览模式按月份逐步加载数据；全历史搜索则先读取 `data/index.json`
中的轻量级索引，再按命中日期分组，只请求相关月份的
JSON，避免一次性下载所有历史数据。

索引条目主要包含日期、标题和描述，完整壁纸信息保存在对应的月度 JSON 中。

## 🎨 色彩指纹与 HSV 颜色分布

每张壁纸保存主色调数据以及 HSV 颜色直方图。当前直方图包含：

``` text
Hue（色相）            12 桶
Saturation（饱和度）    3 桶
Value（明度）           3 桶

12 × 3 × 3 = 108 个颜色区域
```

- **首页色彩指纹：**
  为卡片浏览做简化展示，帮助快速了解整张图片的色彩组成。
- **详情页颜色分布：** 展示更完整的 108 个 HSV 颜色区域。
- **重要说明：**
  这些格子统计整张图片中不同颜色区间的像素分布，并不代表原图的空间位置。因此，左上角的格子不等于原图左上角。

悬停提示的具体内容以页面当前实现为准。

## 🧭 详情页与 SEO

每张壁纸使用独立路径，例如：

``` text
/wallpaper/2026-09-23
```

构建时，`prebuild` 脚本会读取数据仓库的 `data/index.json`，生成：

- `public/sitemap.xml`
- `public/robots.txt`

因此，生成 Sitemap 时必须能访问 `VITE_DATA_BASE_URL` 对应地址下的
`data/index.json`。部署正式站点时，应将 `VITE_SITE_URL`
设置为最终对外访问的规范域名，否则生成的站点地图地址可能不正确。

## 🛠️ 技术栈

- Vue 3
- Vite 7
- JavaScript
- CSS
- Node.js（运行构建与 Sitemap 生成脚本）

## 💻 本地开发

建议使用当前受支持的 Node.js LTS 版本。

``` bash
# 1. 克隆仓库
git clone https://github.com/chendada00/bing-wallpaper.git
cd bing-wallpaper

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 生产构建（会先生成 Sitemap 与 robots.txt）
npm run build

# 5. 本地预览构建结果
npm run preview
```

## ⚙️ 环境变量

在项目根目录创建
`.env.local`（或按部署平台要求配置环境变量）。下面是示例，域名和凭据应替换为自己的配置：

``` dotenv
# 壁纸数据源根地址，不需要在末尾添加斜杠
VITE_DATA_BASE_URL=https://bing-data.伴随.cn

# 正式网站地址，用于生成 sitemap.xml 和 robots.txt
VITE_SITE_URL=https://bing.伴随.cn

# JSONBin 通知数据的 API URL
VITE_JSONBIN_URL=https://api.jsonbin.io/v3/b/YOUR_BIN_ID

# JSONBin 只读 Access Key（示例占位符，不是可用密钥）
VITE_JSONBIN_ACCESS_KEY=YOUR_READ_ONLY_ACCESS_KEY
```

### 变量说明

| 变量                      | 是否需要           | 用途                                                 |
|---------------------------|--------------------|------------------------------------------------------|
| `VITE_DATA_BASE_URL`      | 建议配置           | 数据仓库根地址；不配置时前端使用 GitHub Raw 默认地址 |
| `VITE_SITE_URL`           | 部署时建议配置     | 正式站点 URL，供 Sitemap 与 robots 文件生成脚本使用  |
| `VITE_JSONBIN_URL`        | 使用远程通知时需要 | JSONBin 中通知数据对应的 API 地址                    |
| `VITE_JSONBIN_ACCESS_KEY` | 使用远程通知时需要 | 读取通知数据时发送的 Access Key                      |

### 🔐 环境变量安全说明

1.  **所有 `VITE_` 变量都会在前端构建时暴露给浏览器。**
    不要将数据库密码、Master
    Key、管理密钥或其他真正的服务端秘密放进这些变量。
2.  通知功能如继续由浏览器直接请求 JSONBin，应只使用权限尽可能小的只读
    Access
    Key。更安全的方案是通过服务端代理读取通知，避免在前端暴露凭据。
3.  `.env.local` 应加入 `.gitignore`，不要提交实际密钥。`.gitignore`
    只会阻止未跟踪文件被加入 Git；如果 `.env` 已经被 Git
    跟踪，需要先执行 `git rm --cached .env` 并提交变更。
4.  如果密钥曾经提交到仓库或出现在公开日志中，应在对应服务中撤销并重新生成，不能只靠删除文件解决历史泄露。
5.  修改托管平台的环境变量后，需要重新构建并部署，旧构建不会自动获得新值。

`.gitignore` 示例：

``` gitignore
.env
.env.*
!.env.example
```

## 🌐 部署说明

本项目是静态前端，可以部署到支持 Vite 静态构建的平台，例如 Cloudflare
Pages、EdgeOne Pages、Vercel、Netlify 或 GitHub Pages。

部署前建议检查：

- [ ] `VITE_DATA_BASE_URL` 指向可公开访问的数据源
- [ ] `VITE_SITE_URL` 使用正式域名
- [ ] 通知功能使用的 JSONBin URL 与只读 Access Key 匹配
- [ ] 平台环境变量已应用到当前部署环境，并重新触发构建
- [ ] `sitemap.xml` 和 `robots.txt` 已成功生成
- [ ] 浏览器 Network 面板中月度 JSON、预览图和详情图片请求均正常

如果使用独立的数据域名，数据服务需要正确提供跨域访问响应头。当前
`bing-data` 仓库通过 `_headers`
配置静态资源响应头；若改用其他托管服务，应确认该平台支持并正确应用相应配置。

## 🔗 相关链接

- 🌐 [在线网站](https://bing.伴随.cn)
- 🗂️ [bing-data 数据仓库](https://github.com/chendada00/bing-data)
- 🖥️ [bing-uhd 高清图片仓库](https://github.com/chendada00/bing-uhd)
- 📦 [前端 GitHub 仓库](https://github.com/chendada00/bing-wallpaper)

## 📄 License

本项目使用 MIT License，详见仓库中的 `LICENSE` 文件。
