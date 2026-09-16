<script setup>
import { computed, ref } from 'vue'
import { formatDate } from '../utils/date'

const emit = defineEmits(['open'])
const loaded = ref(false)
const failed = ref(false)

const props = defineProps({
  item: { type: Object, required: true },
})

const placeholder = computed(() => props.item.base64 || '')
const preview = computed(() => props.item.preview || props.item.image || '')

function onLoad() {
  loaded.value = true
}

function onError() {
  failed.value = true
}
</script>

<template>
  <article class="wallpaper-card" @click="emit('open', item)">
    <div class="card-image-wrap">
      <img
        v-if="placeholder"
        class="card-placeholder"
        :src="placeholder"
        alt=""
        aria-hidden="true"
      />
      <img
        class="card-image"
        :class="{ loaded, failed }"
        :src="preview"
        :alt="item.title"
        loading="lazy"
        decoding="async"
        @load="onLoad"
        @error="onError"
      />
      <div v-if="failed" class="image-fallback">图片加载失败</div>
      <div class="date-badge">{{ formatDate(item.date) }}</div>
      <div class="view-badge">查看原图</div>
      <div class="image-shade"></div>
    </div>
    <div class="card-content">
      <h2>{{ item.title }}</h2>
      <p>{{ item.description }}</p>
    </div>
  </article>
</template>
