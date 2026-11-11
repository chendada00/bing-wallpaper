
<template>
  <footer class="site-footer">
    <div class="footer-inner">

      <!-- 左侧：品牌 -->
      <div class="footer-left">
        <span class="brand-wrapper">
          <a class="footer-brand" href="/" aria-label="返回首页">
            <strong>Bing Wallpaper</strong>
          </a>

          <span class="at-symbol">by</span>

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

      <!-- 中间：备案 -->
      <div class="footer-center">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          class="link-item"
        >
          京ICP备2022017849号-4
        </a>
      </div>

      <!-- 右侧：访问量 + 版权 + 返回顶部 -->
      <div class="footer-right">

        <!-- GoatCounter 统计组件 -->
        <div
          class="gc-widget"
          data-gc-widget
          hidden
        >
          <button
            type="button"
            class="gc-trigger"
            data-gc-trigger
            aria-expanded="false"
            aria-controls="gc-panel-home"
            aria-label="查看网站访问统计"
          >
            <svg
              class="gc-eye"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"
              />
              <circle cx="12" cy="12" r="2.8"/>
            </svg>

            <span class="gc-label">累计访问</span>

            <strong data-gc-total>—</strong>
          </button>

          <div
            id="gc-panel-home"
            class="gc-panel"
            data-gc-panel
            hidden
          >
            <div class="gc-panel-heading">
              <div>
                <strong>访问统计</strong>
                <span>网站访问概况</span>
              </div>

              <span class="gc-live-dot"></span>
            </div>

            <div class="gc-total-block">
              <span>累计访问量</span>
              <strong data-gc-total>—</strong>
            </div>

            <div class="gc-stat-grid">
              <div class="gc-stat-item">
                <span>今日</span>
                <strong data-gc-today>—</strong>
              </div>

              <div class="gc-stat-item">
                <span>近 7 天</span>
                <strong data-gc-week>—</strong>
              </div>

              <div class="gc-stat-item">
                <span>近 30 天</span>
                <strong data-gc-month>—</strong>
              </div>
            </div>

            <div class="gc-panel-footer">
              <span>统计数据由 GoatCounter 提供</span>
              <span>↗</span>
            </div>
          </div>
        </div>

        <span class="copyright">
          © {{ currentYear }} 保留所有权利
        </span>

        <a href="#app" class="back-top" aria-label="返回顶部">
          ↑ 顶部
        </a>

      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.site-footer {
  position: fixed;
  z-index: 1000;
  left: 0;
  right: 0;
  bottom: 0;

  box-sizing: border-box;
  width: 100%;
  padding: 0 24px;
  padding-bottom: env(safe-area-inset-bottom, 0);

  background: rgba(247, 247, 247, 0.72);

  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);

  border-top: 1px solid rgba(0, 0, 0, 0.055);
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

.footer-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.brand-wrapper {
  display: inline-flex;
  align-items: center;

  color: var(--text-color, #333);
  font-size: 14px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

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

.personal-link {
  position: relative;
  color: inherit;
  transition: color 0.2s ease;
}

.personal-link:hover {
  color: #2b5af4;
}

.personal-link::after {
  content: attr(data-tooltip);

  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;

  transform: translateX(-50%) translateY(4px);

  background: rgba(30, 30, 30, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  color: #fff;
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;

  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  transition: all 0.2s ease;
  z-index: 1001;
}

.personal-link:hover::after {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

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

.footer-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  min-width: 0;
}

.copyright {
  color: var(--text-secondary, #777);
  font-size: 12px;
  white-space: nowrap;
}

.back-top {
  color: var(--text-secondary, #666);
  font-size: 12px;
  text-decoration: none;

  padding: 4px 12px;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 16px;

  white-space: nowrap;
  transition: all 0.2s ease;
}

.back-top:hover {
  background: rgba(128, 128, 128, 0.2);
  color: #2b5af4;
}

/* ==============================
   GoatCounter 访问量
   ============================== */

.gc-widget {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.gc-widget[hidden] {
  display: none !important;
}

.gc-trigger {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  padding: 5px 10px;

  border: 1px solid rgba(0, 0, 0, 0.045);
  border-radius: 16px;

  background: rgba(128, 128, 128, 0.09);
  color: var(--text-secondary, #666);

  font: inherit;
  font-size: 11px;
  cursor: pointer;

  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.gc-trigger:hover {
  background: rgba(128, 128, 128, 0.16);
  color: var(--text-color, #333);
}

.gc-trigger:focus-visible {
  outline: 2px solid #2b5af4;
  outline-offset: 3px;
}

.gc-eye {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;

  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.gc-trigger strong {
  color: var(--text-color, #333);
  font-size: 12px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

/* 统计悬浮卡片 */
.gc-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 12px);

  width: 280px;
  padding: 17px;

  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 16px;

  background: rgba(255, 255, 255, 0.94);
  color: #252525;

  box-shadow:
    0 12px 38px rgba(0, 0, 0, 0.13),
    0 2px 8px rgba(0, 0, 0, 0.04);

  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);

  z-index: 1100;

  animation: gc-panel-in 0.18s ease both;
}

.gc-panel[hidden] {
  display: none !important;
}

@keyframes gc-panel-in {
  from {
    opacity: 0;
    transform: translateY(5px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.gc-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 13px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.gc-panel-heading > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.gc-panel-heading strong {
  font-size: 13px;
  font-weight: 650;
}

.gc-panel-heading span {
  color: #929292;
  font-size: 10px;
}

.gc-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #45b887;
  box-shadow: 0 0 0 4px rgba(69, 184, 135, 0.12);
}

.gc-total-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 0;
}

.gc-total-block > span,
.gc-stat-item > span {
  color: #888;
  font-size: 11px;
}

.gc-total-block > strong {
  font-size: 27px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.gc-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  padding: 12px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.gc-stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gc-stat-item > strong {
  font-size: 14px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.gc-panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  color: #999;
  font-size: 10px;
}

/* ==============================
   移动端
   ============================== */

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

  .footer-right {
    gap: 8px;
  }

  .link-item,
  .copyright,
  .back-top {
    font-size: 11px;
  }

  .back-top {
    padding: 4px 8px;
  }

  .gc-trigger {
    padding: 5px 8px;
    gap: 5px;
  }

  .gc-panel {
    width: min(280px, calc(100vw - 32px));
  }

  .personal-link::after {
    display: none;
  }
}

@media (max-width: 420px) {
  .footer-center,
  .copyright {
    display: none;
  }

  .footer-right {
    margin-left: auto;
  }

  .gc-label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
