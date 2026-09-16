<template>
  <article
    class="wallpaper-card"
    :style="placeholderStyle"
    @click="$emit('click', item)"
  >
    <div class="card-image">
      <div
        class="card-placeholder"
        :class="{ loaded: imageLoaded }"
      />

      <img
        class="wallpaper-image"
        :src="item.preview || item.image"
        :alt="item.title || item.copyright || item.date"
        loading="lazy"
        @load="handleLoaded"
        @error="handleError"
      />

      <div
        v-if="!imageLoaded"
        class="image-loading"
      >
        <span class="loading-spinner" />
      </div>

      <div class="image-mask" />

      <div class="card-top">
        <span class="date-badge">
          {{ formatDate(item.date) }}
        </span>
      </div>

      <div class="card-content">
        <div class="card-title">
          {{ item.title || 'Bing Wallpaper' }}
        </div>

        <div class="card-description">
          {{ item.description || item.copyright || '' }}
        </div>

        <div class="card-action">
          <span>查看高清</span>
          <span class="arrow">↗</span>
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
  }
})

defineEmits(['click'])

const imageLoaded = ref(false)

const placeholderStyle = computed(() => {
  const base64 = props.item?.base64

  if (!base64) {
    return {}
  }

  return {
    '--placeholder-image': `url("${base64}")`
  }
})

function handleLoaded() {
  imageLoaded.value = true
}

function handleError() {
  imageLoaded.value = false
}

function formatDate(date) {
  if (!date) return ''

  const parts = date.split('-')

  if (parts.length !== 3) {
    return date
  }

  return `${parts[0]}.${parts[1]}.${parts[2]}`
}
</script>

<style scoped>
.wallpaper-card {
  position: relative;
  min-width: 0;
  aspect-ratio: 16 / 10;
  cursor: pointer;
  border-radius: 18px;
  overflow: hidden;
  background: #111;
  transform: translateY(0);
  transition:
    transform 0.45s cubic-bezier(.2,.8,.2,1),
    box-shadow 0.45s ease;
}

.wallpaper-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 24px 50px rgba(0, 0, 0, 0.22),
    0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

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
    transform 0.8s cubic-bezier(.2,.8,.2,1),
    filter 0.5s ease;
}

.wallpaper-image[src] {
  opacity: 1;
}

.wallpaper-card:hover .wallpaper-image {
  transform: scale(1.055);
  filter: brightness(1.06);
}

.image-mask {
  position: absolute;
  inset: 0;

  background:
    linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.05) 0%,
      rgba(0, 0, 0, 0.02) 45%,
      rgba(0, 0, 0, 0.82) 100%
    );

  opacity: 0.8;

  transition: opacity 0.45s ease;
}

.wallpaper-card:hover .image-mask {
  opacity: 1;
}

.card-top {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;

  display: flex;
  justify-content: flex-start;

  z-index: 3;
}

.date-badge {
  padding: 7px 11px;

  border-radius: 10px;

  color: #fff;
  background: rgba(0, 0, 0, 0.3);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;

  border: 1px solid rgba(255, 255, 255, 0.18);

  transition:
    background 0.3s ease,
    transform 0.3s ease;
}

.wallpaper-card:hover .date-badge {
  background: rgba(255, 255, 255, 0.16);
  transform: translateY(-2px);
}

.card-content {
  position: absolute;

  left: 18px;
  right: 18px;
  bottom: 18px;

  z-index: 3;

  color: #fff;
}

.card-title {
  font-size: 18px;
  font-weight: 650;
  line-height: 1.35;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.card-description {
  margin-top: 6px;

  font-size: 12px;
  line-height: 1.5;

  color: rgba(255, 255, 255, 0.82);

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow: hidden;

  opacity: 0.9;
}

.card-action {
  display: flex;
  align-items: center;
  gap: 7px;

  margin-top: 13px;

  font-size: 12px;
  font-weight: 600;

  opacity: 0;
  transform: translateY(8px);

  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.wallpaper-card:hover .card-action {
  opacity: 1;
  transform: translateY(0);
}

.arrow {
  font-size: 16px;
  line-height: 1;

  transition: transform 0.3s ease;
}

.wallpaper-card:hover .arrow {
  transform: translate(2px, -2px);
}

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

  border: 2px solid rgba(255, 255, 255, 0.28);
  border-top-color: rgba(255, 255, 255, 0.95);

  border-radius: 50%;

  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 700px) {
  .wallpaper-card {
    border-radius: 14px;
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
    box-shadow: none;
  }

  .wallpaper-card:hover .wallpaper-image {
    transform: scale(1.01);
  }
}
</style>