<template>
  <div class="search-box">

    <div
      class="search-scope"
      role="group"
      aria-label="搜索范围"
    >

      <button
        type="button"
        :class="{
          active: scope === 'loaded'
        }"
        title="只搜索当前已经加载的壁纸"
        @click="scope = 'loaded'"
      >
        已加载
      </button>

      <button
        type="button"
        :class="{
          active: scope === 'all'
        }"
        title="搜索全部历史；颜色筛选在此模式不可用"
        @click="scope = 'all'"
      >
        全历史
      </button>

    </div>


    <input
      v-model="draftKeyword"
      :placeholder="
        scope === 'all'
          ? '搜索全部历史壁纸'
          : '搜索当前已加载壁纸'
      "
      enterkeyhint="search"
      @keydown.enter.prevent="submitSearch"
    />


    <button
      v-if="
        draftKeyword.trim() !==
        keyword.trim()
      "
      class="search-submit"
      type="button"
      title="搜索"
      @click="submitSearch"
    >
      搜索
    </button>


    <button
      class="color-btn"
      :disabled="scope === 'all'"
      :title="
        scope === 'all'
          ? '全历史搜索暂不支持颜色筛选'
          : '颜色筛选'
      "
      @click="
        showColors = !showColors
      "
    >

      <span
        class="color-icon"
        :style="{
          background:
            color ||
            'linear-gradient(135deg,#667eea,#764ba2)'
        }"
      />

    </button>


    <div
      v-if="
        showColors &&
        scope === 'loaded'
      "
      class="color-menu"
    >

      <div class="color-title">
        选择颜色
      </div>


      <div class="picker-row">

        <input
          class="color-picker"
          type="color"
          v-model="color"
        />


        <div class="current-color">

          <span
            :style="{
              background:
                color || '#ffffff'
            }"
          />

          <div>

            <div>
              当前颜色
            </div>

            <small>
              {{ color || '未选择' }}
            </small>

          </div>

        </div>

      </div>


      <div class="divider" />


      <div class="preset-title">
        推荐颜色
      </div>


      <div class="preset">

        <button
          v-for="item in COLOR_OPTIONS"
          :key="item.name"
          type="button"
          :title="item.name"
          @click="
            selectColor(item.value)
          "
        >

          <span
            class="dot"
            :class="{
              active:
                color === item.value
            }"
            :style="{
              background:
                item.value
            }"
          />

        </button>

      </div>

    </div>


    <button
      v-if="
        keyword ||
        color ||
        draftKeyword
      "
      class="clear"
      type="button"
      title="清除搜索"
      @click="clear"
    >
      ×
    </button>

  </div>
</template>


<script setup>

import {
  ref,
  watch
} from 'vue'

import {
  COLOR_OPTIONS
} from '../utils/colorSimilarity'


const keyword =
  defineModel('keyword')

const date =
  defineModel('date')

const color =
  defineModel('color')

const scope =
  defineModel('scope')


const showColors =
  ref(false)


/*
 * draftKeyword：
 *
 * 用户正在输入的内容。
 *
 * keyword：
 *
 * 真正已经提交、正在参与搜索的关键词。
 */
const draftKeyword =
  ref(keyword.value || '')


watch(
  keyword,
  value => {

    draftKeyword.value =
      value || ''

  }
)


watch(
  scope,
  value => {

    if (value === 'all') {

      color.value = ''

      showColors.value = false

    }

  }
)


function submitSearch() {

  const nextKeyword =
    draftKeyword.value.trim()


  if (
    nextKeyword ===
    keyword.value.trim()
  ) {
    return
  }


  keyword.value =
    nextKeyword
}


function selectColor(value) {

  color.value =
    color.value === value
      ? ''
      : value

  showColors.value = false
}


function clear() {

  draftKeyword.value = ''

  keyword.value = ''

  date.value = ''

  color.value = ''
}

</script>


<style scoped>

.search-box {

  position: relative;

  display: flex;

  align-items: center;

  height: 36px;

  padding: 0 8px;

  border-radius: 14px;

  background:
    rgba(255,255,255,.72);

  border:
    1px solid
    rgba(255,255,255,.6);

  backdrop-filter:
    blur(16px);

  box-shadow:
    0 6px 20px
    rgba(0,0,0,.08);
}


.search-scope {

  display: flex;

  align-items: center;

  gap: 2px;

  margin-right: 6px;

  padding: 2px;

  border-radius: 8px;

  background:
    rgba(0,0,0,.05);
}


.search-scope button {

  border: 0;

  background: transparent;

  border-radius: 6px;

  padding: 3px 6px;

  color: #888;

  font-size: 10px;

  cursor: pointer;

  white-space: nowrap;
}


.search-scope button.active {

  color: #222;

  background:
    rgba(255,255,255,.9);

  box-shadow:
    0 1px 4px
    rgba(0,0,0,.08);
}


.search-box input {

  border: 0;

  outline: none;

  background: transparent;

  width: 130px;

  min-width: 0;

  font-size: 13px;

  color: #333;
}


.search-box input::placeholder {
  color: #888;
}


.search-submit {

  flex-shrink: 0;

  border: 0;

  padding:
    4px 7px;

  border-radius: 7px;

  background:
    rgba(0,0,0,.06);

  color: #444;

  cursor: pointer;

  font-size: 10px;

  font-weight: 600;
}


.search-submit:hover {

  background:
    rgba(0,0,0,.1);
}


.color-btn,
.clear {

  border: 0;

  background: none;

  cursor: pointer;

  display: flex;

  align-items: center;

  justify-content: center;
}


.color-btn:disabled {

  cursor: not-allowed;

  opacity: .45;
}


.color-icon {

  width: 18px;

  height: 18px;

  border-radius: 50%;

  box-shadow:
    0 0 0 2px
    rgba(255,255,255,.8);
}


.clear {

  font-size: 20px;

  color: #777;
}


.color-menu {

  position: absolute;

  right: 0;

  top: 46px;

  width: 220px;

  padding: 14px;

  border-radius: 14px;

  background:
    rgba(255,255,255,.95);

  box-shadow:
    0 14px 40px
    rgba(0,0,0,.16);

  z-index: 20;
}


.color-title,
.preset-title {

  font-size: 12px;

  font-weight: 700;

  color: #555;
}


.picker-row {

  display: flex;

  align-items: center;

  gap: 10px;

  margin-top: 10px;
}


.color-picker {

  width: 38px;

  height: 38px;

  padding: 0;

  border: 0;

  background: transparent;
}


.current-color {

  display: flex;

  align-items: center;

  gap: 8px;

  font-size: 11px;

  color: #666;
}


.current-color > span {

  width: 26px;

  height: 26px;

  border-radius: 50%;

  border:
    1px solid
    rgba(0,0,0,.08);
}


.current-color small {
  color: #999;
}


.divider {

  height: 1px;

  margin: 12px 0;

  background:
    rgba(0,0,0,.08);
}


.preset {

  display: flex;

  flex-wrap: wrap;

  gap: 8px;

  margin-top: 9px;
}


.preset button {

  border: 0;

  padding: 0;

  background: transparent;

  cursor: pointer;
}


.dot {

  display: block;

  width: 20px;

  height: 20px;

  border-radius: 50%;

  border:
    2px solid transparent;

  box-shadow:
    0 1px 5px
    rgba(0,0,0,.12);
}


.dot.active {

  border-color: #111;

  transform: scale(1.12);
}


@media (max-width: 640px) {

  .search-box {

    max-width:
      min(
        250px,
        calc(100vw - 125px)
      );
  }


  .search-scope button {

    padding-left: 4px;

    padding-right: 4px;
  }


  .search-box input {

    width: 72px;
  }


  .search-submit {

    padding-left: 6px;

    padding-right: 6px;
  }

}

</style>