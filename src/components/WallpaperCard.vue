<template>
  <article
    class="wallpaper-card"
    :style="cardStyle"
    @click="$emit('click', item)"
  >
    <div class="card-image">

      <!-- Base64 模糊占位 -->
      <div
        class="card-placeholder"
        :class="{ loaded: imageLoaded }"
      />

      <!-- 图片 -->
      <img
        v-if="shouldLoad"
        class="wallpaper-image"
        :class="{ loaded: imageLoaded }"
        :src="item.preview || item.image"
        :alt="item.title || item.copyright || item.date"
        loading="eager"
        decoding="async"
        @load="handleLoaded"
        @error="handleError"
      />

      <!-- 加载动画 -->
      <div
        v-if="!imageLoaded"
        class="image-loading"
      >
        <span class="loading-spinner" />
      </div>

      <!-- 图片遮罩 -->
      <div class="image-mask" />

      <!-- 顶部信息 -->
      <div class="card-top">
        <span class="date-badge">
          {{ formatDate(item.date) }}
        </span>

        <span
          v-if="accentColor"
          class="color-dot"
          :title="`主色调 ${accentColor}`"
        />
      </div>

      <!-- 底部信息 -->
      <div class="card-content">

        <div class="card-title">
          {{ item.title || 'Bing Wallpaper' }}
        </div>

        <div class="card-description">
          {{ item.description || item.copyright || '' }}
        </div>

        <div class="card-action">
          <span>查看高清</span>

          <span class="arrow">
            ↗
          </span>
        </div>

      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },

  /**
   * 是否允许开始加载真实图片
   */
  shouldLoad: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'click',
  'image-loaded',
  'image-error'
])

const imageLoaded = ref(false)

const accentColor = computed(() => {
  return (
    props.item?.color?.Vibrant ||
    props.item?.color?.LightVibrant ||
    props.item?.color?.Muted ||
    ''
  )
})

const cardStyle = computed(() => {
  const base64 = props.item?.base64

  const style = {}

  if (base64) {
    style['--placeholder-image'] = `url("${base64}")`
  }

  if (accentColor.value) {
    style['--accent-color'] = accentColor.value
  }

  return style
})

function handleLoaded() {
  imageLoaded.value = true

  emit('image-loaded', props.item.date)
}

function handleError() {
  imageLoaded.value = false

  emit('image-error', props.item.date)
}

function formatDate(date) {
  if (!date) {
    return ''
  }

  const parts = date.split('-')

  if (parts.length !== 3) {
    return date
  }

  return `${parts[0]}.${parts[1]}.${parts[2]}`
}
</script>

<style scoped>
.wallpaper-card {
  --accent-color: #ffffff;

  position: relative;

  min-width: 0;

  /*
   * Bing 原图本身就是 16:9，
   * 让图片主体尽可能完整地展示。
   */
  aspect-ratio: 16 / 9;

  cursor: pointer;

  border-radius: 17px;

  overflow: hidden;

  background: #111;

  transform: translateY(0);

  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08);

  transition:
    transform 0.45s cubic-bezier(.2, .8, .2, 1),
    box-shadow 0.45s ease;
}


/* 主色调只做很轻的视觉强调 */

.wallpaper-card::after {
  content: "";

  position: absolute;

  left: 12%;
  right: 12%;
  bottom: -30px;

  height: 60px;

  background: var(--accent-color);

  opacity: 0;

  filter: blur(28px);

  pointer-events: none;

  transition: opacity 0.45s ease;
}

.wallpaper-card:hover {
  transform: translateY(-6px);

  box-shadow:
    0 22px 48px rgba(0, 0, 0, 0.18),
    0 0 0 1px color-mix(
      in srgb,
      var(--accent-color) 35%,
      transparent
    );
}

.wallpaper-card:hover::after {
  opacity: 0.22;
}


/* ================================
   Image
================================ */

.card-image {
  position: relative;

  width: 100%;
  height: 100%;

  overflow: hidden;
}


/* Base64 模糊占位 */

.card-placeholder {
  position: absolute;

  inset: 0;

  background-image: var(--placeholder-image);

  background-size: cover;

  background-position: center;

  filter: blur(18px);

  transform: scale(1.12);

  opacity: 1;

  transition:
    opacity 0.6s ease;
}

.card-placeholder.loaded {
  opacity: 0;
}


/* Wallpaper */

.wallpaper-image {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;

  opacity: 0;

  transform: scale(1.01);

  transition:
    opacity 0.6s ease,
    transform 0.8s cubic-bezier(.2, .8, .2, 1),
    filter 0.5s ease;
}

.wallpaper-image.loaded {
  opacity: 1;
}


/*
 * Hover 时轻微放大，
 * 不要过度裁剪图片主体。
 */

.wallpaper-card:hover .wallpaper-image {
  transform: scale(1.045);

  filter: brightness(1.045);
}


/* ================================
   Image Mask
================================ */

.image-mask {
  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.02) 0%,
      rgba(0, 0, 0, 0.01) 38%,
      rgba(0, 0, 0, 0.78) 100%
    );

  opacity: 0.72;

  transition:
    opacity 0.45s ease;
}

.wallpaper-card:hover .image-mask {
  opacity: 0.9;
}


/* ================================
   Top
================================ */

.card-top {
  position: absolute;

  top: 14px;
  left: 14px;
  right: 14px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  z-index: 3;
}

.date-badge {
  padding: 6px 10px;

  border-radius: 9px;

  color: #fff;

  background: rgba(0, 0, 0, 0.28);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  font-size: 11px;
  font-weight: 600;

  letter-spacing: 0.25px;

  border: 1px solid rgba(255, 255, 255, 0.15);

  transition:
    background 0.3s ease,
    border-color 0.3s ease,
    transform 0.3s ease;
}

.wallpaper-card:hover .date-badge {
  background: color-mix(
    in srgb,
    var(--accent-color) 28%,
    rgba(0, 0, 0, 0.35)
  );

  border-color: color-mix(
    in srgb,
    var(--accent-color) 50%,
    rgba(255, 255, 255, 0.15)
  );

  transform: translateY(-2px);
}


/* 图片主色的小圆点 */

.color-dot {
  width: 9px;
  height: 9px;

  border-radius: 50%;

  background: var(--accent-color);

  border: 1px solid rgba(255, 255, 255, 0.7);

  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.08),
    0 0 14px color-mix(
      in srgb,
      var(--accent-color) 70%,
      transparent
    );

  opacity: 0;

  transform: scale(0.7);

  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.wallpaper-card:hover .color-dot {
  opacity: 1;

  transform: scale(1);
}


/* ================================
   Content
================================ */

.card-content {
  position: absolute;

  left: 17px;
  right: 17px;
  bottom: 16px;

  z-index: 3;

  color: #fff;
}

.card-title {
  font-size: 17px;
  font-weight: 650;

  line-height: 1.35;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.35);
}

.card-description {
  margin-top: 5px;

  font-size: 11px;

  line-height: 1.5;

  color: rgba(255, 255, 255, 0.78);

  display: -webkit-box;

  -webkit-line-clamp: 2;

  -webkit-box-orient: vertical;

  overflow: hidden;

  opacity: 0.9;
}


/* ================================
   Action
================================ */

.card-action {
  display: flex;

  align-items: center;

  gap: 6px;

  margin-top: 11px;

  font-size: 11px;

  font-weight: 600;

  color: color-mix(
    in srgb,
    var(--accent-color) 75%,
    #fff
  );

  opacity: 0;

  transform: translateY(7px);

  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.wallpaper-card:hover .card-action {
  opacity: 1;

  transform: translateY(0);
}

.arrow {
  font-size: 15px;

  line-height: 1;

  transition:
    transform 0.3s ease;
}

.wallpaper-card:hover .arrow {
  transform:
    translate(2px, -2px);
}


/* ================================
   Loading
================================ */

.image-loading {
  position: absolute;

  inset: 0;

  display: flex;

  align-items: center;
  justify-content: center;

  z-index: 2;
}

.loading-spinner {
  width: 22px;
  height: 22px;

  border: 2px solid rgba(255, 255, 255, 0.25);

  border-top-color: rgba(255, 255, 255, 0.95);

  border-radius: 50%;

  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* ================================
   Mobile
================================ */

@media (max-width: 700px) {
  .wallpaper-card {
    border-radius: 14px;

    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.08);
  }

  .card-title {
    font-size: 15px;
  }

  .card-description {
    font-size: 11px;
  }

  .card-action {
    opacity: 1;

    transform: none;
  }

  .wallpaper-card:hover {
    transform: none;

    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.08);
  }

  .wallpaper-card:hover::after {
    opacity: 0;
  }

  .wallpaper-card:hover .wallpaper-image {
    transform: scale(1.01);
  }

  .color-dot {
    display: none;
  }
}
</style>