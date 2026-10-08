# Bing Wallpaper

一个基于 Vue 3 + Vite 的 Bing 每日壁纸收藏、浏览与搜索网站。

在线网站：

**https://bing.伴随.cn**

本项目是整个 Bing Wallpaper 收藏系统的前端仓库。

项目将数据、预览图和 UHD 高清原图拆分到独立仓库中：

- `bing-wallpaper`：网站前端
- `bing-data`：壁纸数据、预览图和历史索引
- `bing-uhd`：UHD 高清原图

三个仓库共同组成完整的 Bing Wallpaper 收藏系统。

---

## 项目组成

```text
Bing Wallpaper
│
├── bing-wallpaper
│   └── Vue 3 + Vite 前端网站
│
├── bing-data
│   ├── 月度 JSON 数据
│   ├── index.json
│   └── preview 预览图
│
└── bing-uhd
    └── UHD 高清原图
```

数据仓库：

**https://bing-data.伴随.cn**

UHD 图片仓库：

**https://bing-uhd.伴随.cn**

---

## 功能

- Bing 每日壁纸浏览
- 历史壁纸时间线
- 关键词搜索
- 按日期搜索
- 全历史搜索
- 颜色搜索
- 主色调分析
- HSV 色彩直方图
- 图片色彩指纹
- 高清图片查看
- UHD 原图查看
- 原图下载
- 壁纸详情页
- 每张壁纸独立 URL
- Sitemap
- SEO 元数据
- 移动端适配

---

## 图片加载策略

网站不会直接使用 UHD 图片作为首页卡片。

不同场景使用不同资源：

```text
首页卡片
    ↓
preview
```

```text
详情页 / 高清查看器
    ↓
sourceImage
    ↓
image
    ↓
preview
```

其中：

- `sourceImage`：Bing 官方 UHD 原图地址
- `image`：项目自己的 UHD 高清镜像
- `preview`：网站浏览使用的预览图
- `base64`：用于快速模糊占位和首页背景

首页使用预览图可以避免一次加载大量 UHD 图片。

高清查看时优先使用官方 UHD 地址，如果官方地址不可用，则回退到项目自己的 UHD 镜像。

---

## 数据来源

前端默认从独立的数据仓库读取数据：

```text
https://bing-data.伴随.cn
```

主要数据结构：

```text
data/
├── index.json
└── YYYY/
    ├── 01.json
    ├── 02.json
    └── ...
```

每个月的数据单独保存，因此前端不需要一次加载全部历史数据。

---

## 历史搜索

全历史搜索使用：

```text
data/index.json
```

索引保存轻量级信息：

```text
日期
标题
描述
```

搜索流程：

```text
关键词
   ↓
index.json
   ↓
匹配日期
   ↓
按月份分组
   ↓
加载对应月份 JSON
   ↓
最终搜索
```

这样可以在静态网站架构下支持较大规模的历史数据。

---

## 色彩分析

每张壁纸包含主色调和颜色直方图。

颜色直方图使用：

```text
Hue        12
Saturation 3
Value      3

12 × 3 × 3
= 108 个区域
```

108 个区域描述整张图片的 HSV 颜色分布。

它不是图片的空间缩略图。

例如：

```text
bin
 ↓
代表某个 HSV 颜色区域

不是：

左上角
右上角
左下角
右下角
```

详情页可以查看完整的 108 个颜色区域。

首页则使用简化后的颜色指纹展示。

---

## 技术栈

- Vue 3
- Vite
- JavaScript
- CSS

项目为纯前端静态网站。

---

## 本地运行

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建：

```bash
npm run build
```

预览生产构建：

```bash
npm run preview
```

---

## 环境变量

```env
VITE_DATA_BASE_URL=https://bing-data.伴随.cn
VITE_SITE_URL=https://bing.伴随.cn
```

其中：

- `VITE_DATA_BASE_URL`：数据仓库地址
- `VITE_SITE_URL`：网站正式地址

项目还使用 JSONBin 提供网站通知功能。

---

## 部署

项目可以部署到支持静态网站的服务。

当前网站部署地址：

**https://bing.伴随.cn**

数据和图片资源分别部署：

```text
前端：
bing.伴随.cn

数据：
bing-data.伴随.cn

UHD：
bing-uhd.伴随.cn
```

---

## 相关仓库

### 前端

本仓库：

```text
chendada00/bing-wallpaper
```

负责网站页面、搜索、浏览、详情页和图片展示。

### 数据

```text
chendada00/bing-data
```

负责：

- 每日壁纸数据
- 历史 JSON
- index.json
- preview
- 颜色分析数据

### UHD

```text
chendada00/bing-uhd
```

负责保存 UHD 高清原图。

---

## License

MIT
