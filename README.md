# 🖼️ Bing Wallpaper Explorer (伴随·光影)

## 🌟 项目简介

**Bing Wallpaper Explorer** 是一款基于 Vue 3 + Vite 构建的现代化 Web 应用，旨在提供极致流畅的 Bing 历史壁纸浏览体验。你可以按时间轴拖动查找、关键词搜索、或利用 Lab 颜色算法根据主色调过滤出风格相近的高清壁纸。

👉 **在线体验地址**：<https://bing.伴随.cn/>

## ✨ 核心功能

* 🗓️ **时间轴无限滚动 (Timeline)**  
  按日期顺序顺畅加载历史壁纸，支持快速切换年份/月份，告别传统翻页。

* 🔍 **多维度搜索与筛选 (Search & Filter)**  
  * 📝 **关键词检索**：匹配壁纸标题、故事描述、文案及地理故事等信息。
  * 🎨 **色彩相似度检索**：内置色彩算法（Lab 颜色空间），支持选择特定主色调，筛选视觉风格相近的壁纸。

* 🔎 **全屏大图交互体验 (ImageViewer)**  
  支持全屏无损预览，提供自由缩放、旋转、一键下载 4K/HD 原图，并能深入阅读壁纸背后的文化与地理背景信息。

* 📱 **响应式与精致 UI Design**  
  全终端适配（PC、平板、手机），配备平滑过渡动画、骨架屏加载状态与优雅的空状态提示。

## 🗄️ 数据源与架构说明

本项目采用**前后端分离 + 静态 API 驱动**的轻量化架构：

1. 📦 **数据仓库 (Data Repo)**：[chendada00/bing-data](https://github.com/chendada00/bing-data)
   * 通过 GitHub Actions / 定时任务每日自动抓取 Bing 官方最新的壁纸元数据。
   * 提取并预处理壁纸的标题、文字故事、版权、主色调（RGB）等信息，并在数据集中**记录 Bing 官方原始 URL 作为源地址存档**，生成 JSON 格式的静态数据集。

2. 🌐 **前端应用 (本仓库)**：
   * 仅负责前端交互与 UI 展现，通过环境变量 `VITE_DATA_BASE_URL` 动态拉取数据仓库托管的 JSON 接口与图片文件。

3. 🖼️ **图片加载机制**：
   * 前端根据配置的 `VITE_DATA_BASE_URL` 托管节点进行壁纸图片的读取与展示，数据集中记录的官方 URL 仅作为元数据备份与源信息参考。

## 🛠️ 技术栈

| 模块 | 技术方案 |
| ----- | ----- |
| **前端框架** | [Vue 3](https://vuejs.org/) (Composition API + `script setup`) |
| **构建工具** | [Vite](https://vitejs.dev/) |
| **CSS 框架** | [Tailwind CSS](https://tailwindcss.com/) |
| **图标库** | [Lucide Icons](https://lucide.dev/) |
| **部署方案** | [Vercel](https://vercel.com/) / [Cloudflare Pages](https://pages.cloudflare.com/) |

## 📁 项目结构

```text
bing-wallpaper-main/
├── 📂 public/              # 静态资源 (Favicon 等)
├── 📂 src/
│   ├── 📂 components/      # 组件库
│   │   ├── EndState.vue        # 底部提示组件
│   │   ├── ImageViewer.vue     # 大图预览与交互面板
│   │   ├── LoadingState.vue    # 加载状态/骨架屏组件
│   │   ├── SearchPanel.vue     # 搜索与色彩筛选面板
│   │   ├── Timeline.vue        # 时间轴导航组件
│   │   └── WallpaperCard.vue   # 单张壁纸卡片组件
│   ├── 📂 composables/     # 逻辑复用 (Composables)
│   │   ├── useBingData.js      # 壁纸数据获取与分页管理
│   │   └── useWallpaperSearch.js # 搜索与色彩过滤逻辑
│   ├── 📂 utils/           # 工具函数
│   │   ├── colorSimilarity.js  # Lab 颜色空间相似度计算算法
│   │   └── date.js             # 日期格式化工具
│   ├── App.vue             # 根组件
│   ├── main.js             # 入口文件
│   └── style.css           # Tailwind 引入与全局样式
├── .env                    # 环境变量配置
├── vite.config.js          # Vite 配置文件
└── vercel.json             # Vercel 路由配置文件
```

## 🚀 本地开发指南

### 1. 克隆项目与安装依赖

```bash
git clone https://github.com/your-username/bing-wallpaper.git
cd bing-wallpaper
npm install
```

### 2. 配置环境变量

在项目根目录下创建或编辑 `.env` 文件：

```env
VITE_DATA_BASE_URL=https://bing-data.your-domain.cn
```

### 3. 运行开发服务与构建

```bash
# 启动本地开发服务器
npm run dev

# 打包构建生产环境代码
npm run build
```

## 🌐 部署指南

### 方案 A：部署到 Vercel (推荐)

1. 将代码提交至 GitHub / GitLab 仓库。
2. 登录 [Vercel Dashboard](https://vercel.com/dashboard) 点击 **"Add New"** -> **"Project"**。
3. 选择你的前端仓库并导入。
4. 在 **Environment Variables** 选项中配置：
   * **Key**: `VITE_DATA_BASE_URL`
   * **Value**: `https://bing-data.your-domain.cn` (请替换为你实际的数据接口地址)
5. 点击 **Deploy** 部署。部署完成后，可在 **Domains** 中绑定自定义域名（如：`bing.伴随.cn`）。

### 方案 B：部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，导航至 **Workers & Pages** -> **Create Application** -> **Pages**。
2. 关联 GitHub 账号并选择前端项目仓库。
3. 在构建设置中填入：
   * **Framework preset**: `Vue` 或 `None`
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
4. 展开 **Environment variables (advanced)** 添加变量：
   * **Variable name**: `VITE_DATA_BASE_URL`
   * **Value**: `https://bing-data.your-domain.cn`
5. 点击 **Save and Deploy** 完成部署，并在 **Custom Domains** 中绑定域名。

## 🤝 贡献与反馈

欢迎提 [Issues](https://github.com/your-username/bing-wallpaper/issues) 或提交 [Pull Requests](https://github.com/your-username/bing-wallpaper/pulls) 帮助改进项目！

## 📄 许可证

本项目遵循 [MIT License](LICENSE) 开源。

壁纸图片版权归 **Microsoft Bing** 及 **原摄影作者** 所有，仅供个人学习交流使用。