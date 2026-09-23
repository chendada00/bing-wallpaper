<template>
  <main class="wallpaper-page">

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
            :src="item.image || item.preview"
            :alt="item.title || `Bing Wallpaper ${item.date}`"
            class="wallpaper-detail-image"
            loading="eager"
            decoding="async"
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
            :href="item.image || item.preview"
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

defineProps({

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


defineEmits([
  'back'
])


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
  min-height: 100vh;

  padding:
    32px 24px 80px;

  background:
    #f6f6f4;
}


.wallpaper-page-inner {
  width: min(
    1100px,
    100%
  );

  margin: 0 auto;
}


.wallpaper-breadcrumb {
  display: flex;

  align-items: center;

  gap: 8px;

  margin-bottom: 28px;

  color: #8a8a8a;

  font-size: 12px;
}


.wallpaper-breadcrumb a {
  color: #555;

  text-decoration: none;

  font-weight: 600;
}


.wallpaper-breadcrumb a:hover {
  color: #111;
}


.wallpaper-detail {
  overflow: hidden;

  border-radius: 20px;

  background: #fff;

  box-shadow:
    0 12px 40px
    rgba(0, 0, 0, 0.08);
}


.wallpaper-detail-header {
  padding:
    34px 38px 26px;
}


.wallpaper-detail-eyebrow {
  margin: 0 0 10px;

  color: #888;

  font-size: 11px;

  font-weight: 700;

  letter-spacing: 0.08em;

  text-transform: uppercase;
}


.wallpaper-detail-header h1 {
  margin: 0;

  color: #181818;

  font-size: clamp(
    28px,
    5vw,
    48px
  );

  line-height: 1.15;
}


.wallpaper-detail-date {
  display: block;

  margin-top: 12px;

  color: #888;

  font-size: 13px;
}


.wallpaper-detail-figure {
  margin: 0;
}


.wallpaper-detail-image {
  display: block;

  width: 100%;
  height: auto;

  background: #111;
}


.wallpaper-detail-figure figcaption {
  padding:
    14px 20px;

  color: #777;

  background: #fafafa;

  font-size: 12px;

  line-height: 1.7;
}


.wallpaper-detail-content {
  padding:
    30px 38px 12px;
}


.wallpaper-detail-content h2 {
  margin:
    0 0 12px;

  color: #222;

  font-size: 18px;
}


.wallpaper-detail-content p {
  margin:
    0 0 14px;

  color: #666;

  font-size: 14px;

  line-height: 1.9;
}


.wallpaper-copyright {
  color: #999 !important;

  font-size: 12px !important;
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

  border-radius: 9px;

  color: #222;

  background: #f1f1ef;

  text-decoration: none;

  font-size: 12px;

  font-weight: 600;
}


.wallpaper-detail-actions a:hover,
.wallpaper-not-found a:hover {
  background: #e7e7e4;
}


.wallpaper-loading,
.wallpaper-not-found {
  padding: 80px 20px;

  text-align: center;
}


.wallpaper-not-found h1 {
  margin: 0 0 12px;

  font-size: 28px;
}


.wallpaper-not-found p {
  margin: 0 0 24px;

  color: #777;
}


@media (max-width: 700px) {

  .wallpaper-page {
    padding:
      18px 12px 50px;
  }


  .wallpaper-detail-header {
    padding:
      24px 20px 20px;
  }


  .wallpaper-detail-content {
    padding:
      24px 20px 8px;
  }


  .wallpaper-detail-actions {
    padding:
      16px 20px 24px;
  }

}

</style>