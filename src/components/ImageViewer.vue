<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatDate } from '../utils/date'

const props = defineProps({
  item: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const loading = ref(true)
const failed = ref(false)
const visible = computed(() => !!props.item)

function close() {
  emit('close')
}

function onImageLoad() {
  loading.value = false
}

function onImageError() {
  loading.value = false
  failed.value = true
}

function onKeydown(event) {
  if (event.key === 'Escape' && visible.value) close()
}

watch(
  () => props.item,
  () => {
    loading.value = true
    failed.value = false
  },
)

watch(visible, (value) => {
  document.body.classList.toggle('viewer-open', value)
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('viewer-open')
})
</script>

<template>
  <Transition name="viewer-fade">
    <div v-if="item" class="viewer" @click.self="close">
      <div class="viewer-topbar">
        <div class="viewer-info">
          <span>{{ formatDate(item.date) }}</span>
          <strong>{{ item.title }}</strong>
        </div>
        <button class="icon-button" type="button" aria-label="关闭" @click="close">×</button>
      </div>

      <div class="viewer-stage">
        <div v-if="loading" class="viewer-loading">
          <span class="spinner"></span>
          <span>正在加载原图…</span>
        </div>
        <div v-if="failed" class="viewer-error">原图加载失败，请稍后重试。</div>
        <img
          class="original-image"
          :class="{ 'is-loaded': !loading && !failed }"
          :src="item.image"
          :alt="item.title"
          decoding="async"
          @load="onImageLoad"
          @error="onImageError"
        />
      </div>

      <div class="viewer-bottom">
        <p>{{ item.description }}</p>
        <a
          class="download-button"
          :href="item.image"
          target="_blank"
          rel="noopener noreferrer"
        >
          打开原图
          <span>↗</span>
        </a>
      </div>
    </div>
  </Transition>
</template>
