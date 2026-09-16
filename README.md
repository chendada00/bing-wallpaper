# Bing Wallpaper

一个纯静态的 Bing 每日壁纸展示站，数据来自 `chendada00/bing-data`。

## 特性

- Vue 3 + Vite
- 无后端、无数据库、无运行时环境变量
- 默认直接读取 GitHub Raw 数据
- 首屏自动加载最新月份
- 不按月份分组，按日期倒序连续展示
- 滚动到底部自动加载更早的月份
- Preview 图片懒加载
- Base64 模糊占位 → Preview → 点击加载 UHD 原图
- 点击卡片打开原图查看器
- 手机 / 平板 / PC 自适应
- 可部署到 Vercel、Cloudflare Pages、EdgeOne Pages、GitHub Pages、Nginx 等静态托管平台

## 数据源

默认：

`https://raw.githubusercontent.com/chendada00/bing-data/main`

如果需要更换数据源，可以设置：

`VITE_DATA_BASE_URL`

例如：

`VITE_DATA_BASE_URL=https://your-domain.example.com`

数据格式要求：

`data/YYYY/MM.json`

每条记录至少包含：

- `date`
- `title`
- `preview`
- `image`

`base64`、`description`、`color` 为可选字段。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建结果在 `dist/`。

## Vercel

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Cloudflare Pages / EdgeOne Pages

- Framework: Vite / Vue
- Build Command: `npm run build`
- Output Directory: `dist`
