<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <!-- 左侧：品牌 + 个人主页 -->
      <div class="footer-left">
        <span class="brand-wrapper">
          <a class="footer-brand" href="/" aria-label="返回首页">
            <strong>Bing Wallpaper</strong>
          </a>
          <span class="at-symbol"> by </span>
          
          <a 
            href="https://www.xn--xpqp35o.cn/" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="personal-link"
            data-tooltip="访问个人主页"
          >
            伴随
          </a>
        </span>
      </div>

      <!-- 中间：备案信息 -->
      <div class="footer-center">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="link-item">
          京ICP备2022017849号-2
        </a>
      </div>

      <!-- 右侧：版权 + 返回顶部 -->
      <div class="footer-right">
        <span class="copyright">© {{ currentYear }} 保留所有权利</span>
        <a href="#app" class="back-top" aria-label="返回顶部">↑ 顶部</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
/* 底部置底，融入页面 */
.site-footer {
  position: fixed;
  z-index: 1000;
  left: 0;
  right: 0;
  bottom: 0;
  
  box-sizing: border-box;
  width: 100%;
  padding: 0 24px;
  padding-bottom: env(safe-area-inset-bottom, 0); /* 适配 iPhone 底部安全区 */

  /* 半透明毛玻璃效果 */
  background: var(--bg-color, rgba(255, 255, 255, 0.65));
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  
  border-top: 1px solid var(--border-color, rgba(128, 128, 128, 0.15));
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1440px;
  height: 48px;
  margin: 0 auto;
  gap: 20px;
}

/* --- 左侧区域 --- */
.footer-left {
  position: relative; /* 为 tooltip 提供定位基准 */
  display: flex;
  align-items: center;
}

/* 将品牌组合成一个整体 */
.brand-wrapper {
  display: inline-flex;
  align-items: center;
  color: var(--text-color, #333);
  font-size: 14px;
  letter-spacing: 0.5px;
}

/* 统一去掉下划线 */
.brand-wrapper a {
  text-decoration: none !important;
}

.footer-brand strong {
  color: inherit;
  font-size: inherit;
}

.at-symbol {
  color: var(--text-secondary, #777);
  margin: 0 4px;
}

/* 伴随链接基础样式 */
.personal-link {
  position: relative;
  color: inherit;
  font-weight: normal;
  transition: color 0.2s ease;
}

.personal-link:hover {
  color: #2b5af4;
}

/* --- 自定义 Tooltip 弹窗样式 --- */
.personal-link::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  
  /* 弹窗外观：半透明毛玻璃 */
  background: rgba(30, 30, 30, 0.75);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  
  /* 阴影与边框 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  /* 默认隐藏，带过渡动画 */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 1001;
}

/* Tooltip 底部的小三角 */
.personal-link::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  border-width: 4px 4px 0;
  border-style: solid;
  border-color: rgba(30, 30, 30, 0.75) transparent transparent transparent;
  
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 1001;
}

/* 悬停时浮现 */
.personal-link:hover::after,
.personal-link:hover::before {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

/* --- 中间区域 --- */
.footer-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-item {
  color: var(--text-secondary, #666);
  font-size: 12px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link-item:hover {
  color: #2b5af4;
}

/* --- 右侧区域 --- */
.footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.copyright {
  color: var(--text-secondary, #777);
  font-size: 12px;
}

.back-top {
  color: var(--text-secondary, #666);
  font-size: 12px;
  text-decoration: none;
  padding: 4px 12px;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 16px;
  transition: all 0.2s ease;
}

.back-top:hover {
  background: rgba(128, 128, 128, 0.2);
  color: #2b5af4;
}

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  .site-footer {
    padding: 0 16px;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .footer-inner {
    height: 44px;
    gap: 10px;
  }

  .brand-wrapper {
    font-size: 13px;
  }

  .link-item,
  .copyright,
  .back-top {
    font-size: 11px;
  }
  
  .back-top {
    padding: 4px 8px;
  }

  /* 移动端禁用 Tooltip，避免遮挡内容 */
  .personal-link::after,
  .personal-link::before {
    display: none;
  }
}

/* 极窄屏幕：隐藏版权文字，保留核心信息，防止折行 */
@media (max-width: 420px) {
  .copyright {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .link-item,
  .personal-link,
  .back-top {
    transition: none;
  }
}
</style>