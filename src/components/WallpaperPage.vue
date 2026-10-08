<template>
  <main
    class="wallpaper-page"
    :style="pageStyle"
    @click.self="$emit('back')"
  >

    <div class="wallpaper-page-inner">

      <nav class="wallpaper-breadcrumb">
        <a
          href="/"
          @click.prevent="$emit('back')"
        >
          Bing Wallpaper
        </a>

        <span>/</span>

        <span>
          {{ item?.date || '壁纸' }}
        </span>
      </nav>


      <article
        v-if="item"
        class="wallpaper-detail"
      >

        <header class="wallpaper-detail-header">

          <p class="wallpaper-detail-eyebrow">
            Bing Wallpaper · 每日高清壁纸
          </p>

          <h1>
            {{ item.title || 'Bing Wallpaper' }}
          </h1>

          <time
            :datetime="item.date"
            class="wallpaper-detail-date"
          >
            {{ formatDate(item.date) }}
          </time>

        </header>


        <figure class="wallpaper-detail-figure">

          <img
            :src="activeImageUrl"
            :alt="item.title || `Bing Wallpaper ${item.date}`"
            class="wallpaper-detail-image"
            loading="eager"
            decoding="async"
            @error="handleImageError"
          />

          <figcaption
            v-if="item.description || item.copyright"
          >
            {{ item.description || item.copyright }}
          </figcaption>

        </figure>


        <section class="wallpaper-detail-content">

          <h2>
            {{ item.title || 'Bing Wallpaper' }}
          </h2>

          <p
            v-if="item.description"
          >
            {{ item.description }}
          </p>

          <p
            v-if="item.copyright"
            class="wallpaper-copyright"
          >
            {{ item.copyright }}
          </p>

        </section>


        <div class="wallpaper-detail-actions">

          <a
            :href="highResImageUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看高清原图
          </a>

          <a
            href="/"
            @click.prevent="$emit('back')"
          >
            返回壁纸首页
          </a>

        </div>

      </article>


      <section
        v-else-if="notFound"
        class="wallpaper-not-found"
      >

        <h1>
          壁纸不存在
        </h1>

        <p>
          没有找到这个日期对应的 Bing Wallpaper。
        </p>

        <a
          href="/"
          @click.prevent="$emit('back')"
        >
          返回首页
        </a>

      </section>


      <section
        v-else
        class="wallpaper-loading"
      >
        正在加载壁纸……
      </section>

    </div>

  </main>
</template>


<script setup>

import { computed } from 'vue'

import {
  getHighResImageUrl
} from '../utils/image'

const highResImageUrl = computed(() => {
  return getHighResImageUrl(
    props.item
  )
})

const props = defineProps({
  item: {
    type: Object,
    default: null
  },

  loading: {
    type: Boolean,
    default: false
  },

  notFound: {
    type: Boolean,
    default: false
  }
})

const pageStyle = computed(() => {
  const base64 = props.item?.base64

  if (!base64) {
    return {}
  }

  return {
    '--wallpaper-background': `url("${base64}")`
  }
})

const activeImageUrl =
  ref('')


defineEmits([
  'back'
])

watch(
  () => props.item,
  item => {
    activeImageUrl.value =
      getHighResImageUrl(item)
  },
  {
    immediate: true
  }
)

function handleImageError() {
  if (
    props.item?.image &&
    activeImageUrl.value !==
      props.item.image
  ) {
    activeImageUrl.value =
      props.item.image

    return
  }

  if (
    props.item?.preview &&
    activeImageUrl.value !==
      props.item.preview
  ) {
    activeImageUrl.value =
      props.item.preview
  }
}

function formatDate(date) {

  if (!date) {
    return ''
  }

  const parts =
    date.split('-')

  if (parts.length !== 3) {
    return date
  }

  return (
    `${parts[0]}.${parts[1]}.${parts[2]}`
  )
}

</script>


<style scoped>
.wallpaper-page {

  position: relative;

  min-height: 100vh;

  padding:
    28px 24px 80px;

  overflow: hidden;

  isolation: isolate;

  background: #0b0c0f;
}


.wallpaper-page::before {

  content: '';

  position: fixed;

  inset: -8%;

  z-index: -2;

  background-image:
    var(--wallpaper-background);

  background-position: center;

  background-repeat: no-repeat;

  background-size: cover;

  filter:
    blur(42px)
    saturate(1.08);

  transform:
    scale(1.08);

  opacity: .54;

  pointer-events: none;
}


.wallpaper-page::after {

  content: '';

  position: fixed;

  inset: 0;

  z-index: -1;

  background:
    linear-gradient(
      180deg,
      rgba(5,6,8,.36),
      rgba(5,6,8,.56)
    );

  pointer-events: none;
}


.wallpaper-page-inner {

  width:
    min(1180px, 100%);

  margin:
    0 auto;
}


.wallpaper-breadcrumb {

  display: flex;

  align-items: center;

  gap: 8px;

  margin-bottom: 18px;

  color:
    rgba(255,255,255,.48);

  font-size: 12px;
}


.wallpaper-breadcrumb a {

  color:
    rgba(255,255,255,.78);

  text-decoration: none;

  font-weight: 600;
}


.wallpaper-breadcrumb a:hover {

  color: #fff;
}


.wallpaper-detail {

  overflow: hidden;

  border:
    1px solid
    rgba(255,255,255,.12);

  border-radius: 20px;

  background:
    rgba(13,14,17,.78);

  box-shadow:
    0 28px 90px
    rgba(0,0,0,.34),

    inset 0 1px 0
    rgba(255,255,255,.05);

  backdrop-filter:
    blur(20px)
    saturate(120%);

  -webkit-backdrop-filter:
    blur(20px)
    saturate(120%);
}


.wallpaper-detail-header {

  padding:
    34px 38px 28px;
}


.wallpaper-detail-eyebrow {

  margin:
    0 0 10px;

  color:
    rgba(255,255,255,.48);

  font-size: 11px;

  font-weight: 700;

  letter-spacing:
    .08em;

  text-transform:
    uppercase;
}


.wallpaper-detail-header h1 {

  margin: 0;

  color:
    rgba(255,255,255,.94);

  font-size:
    clamp(28px,5vw,48px);

  line-height: 1.15;
}


.wallpaper-detail-date {

  display: block;

  margin-top: 12px;

  color:
    rgba(255,255,255,.48);

  font-size: 13px;

  letter-spacing:
    .04em;
}


.wallpaper-detail-figure {

  margin: 0;
}


.wallpaper-detail-image {

  display: block;

  width: 100%;

  height: auto;

  background: #050607;
}


.wallpaper-detail-figure figcaption {

  padding:
    14px 20px;

  color:
    rgba(255,255,255,.58);

  background:
    rgba(0,0,0,.22);

  font-size: 12px;

  line-height: 1.7;

  border-top:
    1px solid
    rgba(255,255,255,.07);
}


.wallpaper-detail-content {

  padding:
    28px 38px 8px;
}


.wallpaper-detail-content h2 {

  margin:
    0 0 12px;

  color:
    rgba(255,255,255,.86);

  font-size: 18px;
}


.wallpaper-detail-content p {

  margin:
    0 0 14px;

  color:
    rgba(255,255,255,.62);

  font-size: 14px;

  line-height: 1.9;
}


.wallpaper-copyright {

  color:
    rgba(255,255,255,.38) !important;

  font-size:
    12px !important;
}


.wallpaper-detail-actions {

  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  padding:
    20px 38px 34px;
}


.wallpaper-detail-actions a,
.wallpaper-not-found a {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  min-height: 38px;

  padding:
    0 15px;

  border:
    1px solid
    rgba(255,255,255,.12);

  border-radius: 9px;

  color:
    rgba(255,255,255,.86);

  background:
    rgba(255,255,255,.08);

  text-decoration: none;

  font-size: 12px;

  font-weight: 600;

  transition:
    background .2s ease,
    transform .2s ease;
}


.wallpaper-detail-actions a:hover,
.wallpaper-not-found a:hover {

  background:
    rgba(255,255,255,.14);

  transform:
    translateY(-1px);
}


.wallpaper-loading,
.wallpaper-not-found {

  padding:
    80px 20px;

  color:
    rgba(255,255,255,.78);

  text-align: center;
}


.wallpaper-not-found h1 {

  margin:
    0 0 12px;

  font-size: 28px;
}


.wallpaper-not-found p {

  margin:
    0 0 24px;

  color:
    rgba(255,255,255,.5);
}


@media (max-width:700px) {

  .wallpaper-page {

    padding:
      14px 12px 42px;
  }


  .wallpaper-breadcrumb {

    margin-bottom: 12px;

    font-size: 11px;
  }


  .wallpaper-detail {

    border-radius: 14px;
  }


  .wallpaper-detail-header {

    padding:
      22px 18px 18px;
  }


  .wallpaper-detail-header h1 {

    font-size: 27px;
  }


  .wallpaper-detail-content {

    padding:
      22px 18px 6px;
  }


  .wallpaper-detail-actions {

    padding:
      16px 18px 22px;
  }


  .wallpaper-detail-actions a {

    min-height: 40px;

    flex:
      1 1 auto;
  }

}

</style>