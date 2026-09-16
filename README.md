# Bing Wallpaper · 伴随光影

一个基于 Vue 3 + Vite 构建的 Bing 每日壁纸收藏与浏览网站。

项目名称：

> **伴随·光影**

网站定位：

> 每日一景，长久珍藏。

项目通过独立的数据仓库获取 Bing 壁纸数据，不需要后端服务、数据库或 API Server，可以直接部署到各种静态网站托管平台。

---

## 在线项目

### 前端

```text
https://github.com/chendada00/bing-wallpaper
```

### 数据

```text
https://github.com/chendada00/bing-data
```

前端和数据完全分离。

---

# 项目特点

- Vue 3
- Vite
- 纯静态网站
- 无后端
- 无数据库
- 无限滚动历史壁纸
- 按日期倒序展示
- Preview 图片用于列表展示
- Base64 极小图片作为占位
- 高清原图后台预加载
- 高清图片加载完成后再切换
- 图片查看器
- 左右切换壁纸
- ESC 关闭查看器
- 原图下载
- 打开原图
- 图片主色调显示
- 主色调复制
- 主色调氛围背景
- PC / 平板 / 手机自适应
- 支持自定义数据源
- 支持 Vercel
- 支持 Cloudflare Pages
- 支持 EdgeOne Pages
- 支持 GitHub Pages
- 支持 Nginx 等静态部署

---

# 页面设计

网站采用：

```text
伴随·光影
每日一景，长久珍藏。
```

作为主要视觉主题。

首页不会单独突出“今日壁纸”，而是将壁纸按照时间倒序连续排列。

用户可以不断向下滚动浏览历史壁纸。

---

# 数据加载架构

前端不直接调用 Bing。

数据来源为：

```text
bing-data
```

默认数据地址：

```text
https://bing-data.伴随.cn
```

前端通过：

```text
data/YYYY/MM.json
```

获取数据。

例如：

```text
https://bing-data.伴随.cn/data/2026/09.json
```

图片资源：

```text
https://bing-data.伴随.cn/preview/2026/09/2026-09-16.jpg
```

高清原图：

```text
https://bing-data.伴随.cn/images/2026/09/2026-09-16.jpg
```

---

# 图片加载策略

为了避免用户打开壁纸时长时间等待，图片查看器采用渐进式加载。

流程：

```text
Base64
   │
   ▼
立即显示模糊占位
   │
   ▼
后台请求 UHD 原图
   │
   ▼
原图完整加载
   │
   ▼
切换到 UHD
```

因此即使原图较大，用户也不会看到空白区域。

---

# 图片列表

列表主要使用：

```text
preview
```

而不是直接加载 UHD 原图。

这样可以显著降低：

- 首屏流量
- 图片加载时间
- 浏览历史壁纸时的网络消耗

---

# 无限滚动

前端按照月份加载历史数据。

例如当前时间为：

```text
2026-09
```

首先加载：

```text
data/2026/09.json
```

当用户继续向下滚动时：

```text
2026/08.json
2026/07.json
2026/06.json
...
```

如果连续多个历史月份不存在有效数据，则停止继续请求。

---

# 数据源配置

前端使用：

```text
VITE_DATA_BASE_URL
```

配置数据源。

根目录：

```text
.env
```

当前配置：

```env
VITE_DATA_BASE_URL=https://bing-data.伴随.cn
```

对应代码会读取：

```js
import.meta.env.VITE_DATA_BASE_URL
```

---

# 更换数据源

如果你的数据仓库部署到了其他域名：

例如：

```text
https://wallpaper-data.example.com
```

只需要修改：

```env
VITE_DATA_BASE_URL=https://wallpaper-data.example.com
```

然后重新构建：

```bash
npm run build
```

即可。

前端组件不需要修改。

---

# 本地开发

## 环境要求

建议：

```text
Node.js 18+
```

推荐使用：

```text
Node.js 20 / 22
```

---

## 安装依赖

```bash
npm install
```

---

## 启动开发服务器

```bash
npm run dev
```

默认会启动 Vite 开发服务器。

终端会显示访问地址，例如：

```text
http://localhost:5173
```

---

# 构建生产版本

执行：

```bash
npm run build
```

构建结果：

```text
dist/
```

可以直接将 `dist/` 部署到静态网站服务器。

---

# 本地预览生产版本

如果项目配置了 Vite Preview，可以使用：

```bash
npm run preview
```

---

# Vercel 部署

项目可以直接导入 Vercel。

## Build Command

```text
npm run build
```

## Output Directory

```text
dist
```

## Install Command

```text
npm install
```

## 环境变量

如果仓库根目录已经存在：

```text
.env
```

通常无需额外配置。

如果在 Vercel 后台配置：

```text
VITE_DATA_BASE_URL
```

填写：

```text
https://bing-data.伴随.cn
```

---

# Cloudflare Pages

创建 Pages 项目并连接 GitHub 仓库。

配置：

```text
Framework preset:
Vite

Build command:
npm run build

Build output directory:
dist
```

环境变量：

```text
VITE_DATA_BASE_URL
```

值：

```text
https://bing-data.伴随.cn
```

---

# EdgeOne Pages

创建 EdgeOne Pages 项目并连接 GitHub。

构建命令：

```text
npm run build
```

输出目录：

```text
dist
```

如果平台没有自动读取仓库 `.env`，可以在环境变量中配置：

```text
VITE_DATA_BASE_URL=https://bing-data.伴随.cn
```

---

# GitHub Pages

项目是标准 Vite 静态网站，因此也可以部署到 GitHub Pages。

构建：

```bash
npm install
npm run build
```

将：

```text
dist/
```

部署到 Pages。

如果使用 GitHub Actions 自动部署，需要根据实际 Pages 配置设置 Vite 的 `base`。

---

# Nginx 部署

构建：

```bash
npm run build
```

将：

```text
dist/
```

上传到 Nginx 网站目录。

例如：

```text
/var/www/bing-wallpaper/
```

Nginx：

```nginx
server {
    listen 80;
    server_name wallpaper.example.com;

    root /var/www/bing-wallpaper;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

如果以后增加 Vue Router，需要保留：

```nginx
try_files $uri $uri/ /index.html;
```

---

# 项目结构

```text
bing-wallpaper/
├── .env
├── index.html
├── package.json
├── vite.config.*
│
└── src/
    ├── main.js
    ├── App.vue
    ├── style.css
    │
    ├── components/
    │   ├── WallpaperCard.vue
    │   ├── ImageViewer.vue
    │   ├── LoadingState.vue
    │   └── EndState.vue
    │
    ├── composables/
    │   └── useBingData.js
    │
    └── utils/
        └── date.*
```

---

# 核心组件

## App.vue

负责：

- 页面整体结构
- Header
- 壁纸列表
- 无限滚动
- 加载状态
- 错误状态
- 图片查看器控制

---

## WallpaperCard.vue

负责单张壁纸卡片：

```text
Preview
+
标题
+
日期
+
鼠标交互
```

点击卡片后进入图片查看器。

---

## ImageViewer.vue

负责高清壁纸查看。

功能包括：

- UHD 原图加载
- Base64 占位
- 高清图预加载
- 加载动画
- 加载状态文字
- 加载失败处理
- 左右切换
- ESC 关闭
- 原图下载
- 打开原图
- 图片主色调
- 主色调复制
- 主色调背景氛围

---

## useBingData.js

负责数据层。

主要功能：

- 获取月份 JSON
- 月份递减
- 历史数据加载
- 去重
- 排序
- 加载状态
- 错误处理
- 无限滚动数据支持

---

# 数据格式

前端要求数据仓库中的 JSON 至少包含：

```json
{
  "items": [
    {
      "date": "2026-09-16",
      "title": "北极的新晋探索者",
      "preview": "https://example.com/preview/2026/09/2026-09-16.jpg",
      "image": "https://example.com/images/2026/09/2026-09-16.jpg"
    }
  ]
}
```

可选字段：

```text
description
copyright
copyrightLink
base64
color
width
height
id
startDate
fullStartDate
endDate
```

---

# 与 bing-data 的关系

本项目只负责：

```text
展示
```

数据仓库负责：

```text
获取
处理
存储
```

关系：

```text
┌─────────────────────────┐
│       Bing              │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ chendada00/bing-data    │
│                         │
│ GitHub Actions          │
│ 图片处理                │
│ JSON                    │
│ UHD                     │
│ Preview                 │
│ Base64                  │
└────────────┬────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────┐
│ chendada00/bing-wallpaper│
│                         │
│ Vue 3                   │
│ Vite                    │
│ 图片浏览                │
│ 无限滚动                │
│ 查看器                  │
└─────────────────────────┘
             │
             ▼
           用户
```

---

# 两个仓库为什么分开

采用前后端资源分离的方式，可以避免：

- 前端仓库频繁提交图片
- 前端构建受到大量图片影响
- 图片资源和网站代码耦合
- 更换 CDN 时需要修改前端组件
- 数据更新导致前端重新开发

以后如果图片资源迁移到：

```text
Cloudflare R2
EdgeOne
OSS
COS
CDN
Nginx
```

只需要调整数据源地址即可。

---

# 自定义资源域名

当前前端：

```env
VITE_DATA_BASE_URL=https://bing-data.伴随.cn
```

数据仓库：

```env
ASSET_BASE_URL=https://bing-data.伴随.cn
```

两者保持一致。

其中：

```text
ASSET_BASE_URL
```

决定 JSON 中图片资源地址。

而：

```text
VITE_DATA_BASE_URL
```

决定前端从哪里读取 JSON。

---

# 更换 CDN 的推荐流程

例如以后迁移到：

```text
https://cdn.example.com
```

### 第一步

修改：

```text
bing-data/.env
```

```env
ASSET_BASE_URL=https://cdn.example.com
```

### 第二步

运行：

```text
Migrate History Asset URLs
```

将历史 JSON 中的：

```text
image
preview
```

全部迁移到新域名。

### 第三步

修改：

```text
bing-wallpaper/.env
```

```env
VITE_DATA_BASE_URL=https://cdn.example.com
```

### 第四步

重新部署前端。

完成。

---

# GitHub 仓库入口

网站 Header 中提供：

```text
源码
数据
```

分别指向：

```text
bing-wallpaper
bing-data
```

方便查看项目源码和完整壁纸数据。

---

# 技术栈

- Vue 3
- Vite
- JavaScript
- CSS
- IntersectionObserver
- GitHub
- 静态资源 CDN

---

# 浏览器兼容

建议使用现代浏览器：

- Chrome
- Edge
- Firefox
- Safari

部分功能依赖现代浏览器 API，例如：

```text
IntersectionObserver
Clipboard API
URL.createObjectURL
```

---

# 性能设计

项目采用多级图片策略：

```text
Base64
  ↓
Preview
  ↓
UHD
```

其中：

### Base64

极小，仅用于占位。

### Preview

用于壁纸列表。

### UHD

只在用户进入图片查看器后加载。

这样可以避免首页一次性加载大量 4K 图片。

---

# 项目定位

这个项目不是一个在线壁纸生成服务，也不需要后端 API。

它更接近一个：

> **个人 Bing 壁纸长期收藏与浏览站。**

数据独立保存，前端独立部署。

即使未来更换：

```text
Vercel
Cloudflare
EdgeOne
Nginx
CDN
```

也不会影响历史数据。

---

# 相关项目

### 数据仓库

`chendada00/bing-data`

负责：

- Bing 数据获取
- 原图
- Preview
- Base64
- JSON
- GitHub Actions

### 前端仓库

`chendada00/bing-wallpaper`

负责：

- 壁纸展示
- 无限滚动
- 高清查看
- 下载
- 图片信息
- UI

---

## License

项目代码采用 MIT License。

Bing 壁纸图片版权归原作者及相关版权方所有。本项目主要用于个人学习、展示与壁纸收藏，请遵守相关图片版权和使用规定。