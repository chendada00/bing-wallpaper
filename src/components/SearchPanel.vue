<template>

<div class="search-box">


  <input
    v-model="keyword"
    placeholder="搜索当前页面壁纸"
  />



  <button
    class="color-btn"
    title="颜色筛选"
    @click="showColors=!showColors"
  >

    <span
      class="color-icon"
      :style="{
        background: color || 'linear-gradient(135deg,#667eea,#764ba2)'
      }"
    />

  </button>



  <div
    v-if="showColors"
    class="color-menu"
  >


    <div class="color-title">
      选择颜色
    </div>



    <!-- 当前颜色 -->

    <div class="picker-row">


      <input
        class="color-picker"
        type="color"
        v-model="color"
      />



      <div class="current-color">


        <span
          :style="{
            background: color || '#ffffff'
          }"
        />


        <div>

          <div>
            当前颜色
          </div>


          <small>
            {{color || '未选择'}}
          </small>


        </div>


      </div>


    </div>



    <div class="divider"/>



    <div class="preset-title">
      推荐颜色
    </div>



    <div class="preset">


      <button

        v-for="item in COLOR_OPTIONS"

        :key="item.name"

        :title="item.name"

        @click="selectColor(item.value)"

      >

        <span

          class="dot"

          :class="{
            active:color===item.value
          }"

          :style="{
            background:item.value
          }"

        />


      </button>


    </div>


  </div>



  <button

    v-if="keyword || color"

    class="clear"

    @click="clear"

  >

    ×


  </button>


</div>


</template>



<script setup>

import {
  ref
} from 'vue'


import {
  COLOR_OPTIONS
} from '../utils/colorSimilarity'



const keyword = defineModel(
  'keyword'
)


const color = defineModel(
  'color'
)



const emit = defineEmits([
  'clear'
])



const showColors = ref(false)




function selectColor(value){


  if(color.value===value){

    color.value=''

  }else{

    color.value=value

  }


  showColors.value=false

}





function clear(){


  keyword.value=''

  color.value=''


  emit(
    'clear'
  )


}



</script>




<style scoped>


.search-box{


position:relative;


display:flex;


align-items:center;


height:36px;


padding:0 8px;


border-radius:14px;


background:
rgba(255,255,255,.72);


border:
1px solid rgba(255,255,255,.6);


backdrop-filter:
blur(16px);



box-shadow:

0 6px 20px rgba(0,0,0,.08);



}



.search-box input{


border:0;


outline:none;


background:transparent;


width:130px;


font-size:13px;


color:#333;


}



.search-box input::placeholder{

color:#888;

}





.color-btn,
.clear{


border:0;


background:none;


cursor:pointer;


display:flex;


align-items:center;


justify-content:center;


}





.color-icon{


width:18px;


height:18px;


border-radius:50%;


box-shadow:

0 0 0 2px rgba(255,255,255,.8);


}





.clear{


font-size:20px;


color:#777;


}





.color-menu{


position:absolute;


right:0;


top:46px;


width:220px;


padding:16px;



background:

rgba(255,255,255,.86);



backdrop-filter:

blur(20px);



border-radius:18px;



box-shadow:

0 20px 50px rgba(0,0,0,.18);



z-index:100;


}



.color-title{


font-size:14px;


font-weight:600;


margin-bottom:12px;


}





.picker-row{


display:flex;


align-items:center;


gap:12px;


}



.color-picker{


width:46px;


height:46px;


border:0;


padding:0;


background:none;


cursor:pointer;


}




.current-color{


display:flex;


align-items:center;


gap:8px;


font-size:12px;


color:#555;


}



.current-color span{


width:26px;


height:26px;


border-radius:50%;


border:1px solid #ddd;


}



.current-color small{


color:#999;


}




.divider{


height:1px;


background:#eee;


margin:15px 0;


}




.preset-title{


font-size:12px;


color:#888;


margin-bottom:10px;


}



.preset{


display:flex;


gap:12px;


flex-wrap:wrap;


}



.preset button{


border:0;


background:none;


padding:0;


cursor:pointer;


}



.dot{


display:block;


width:26px;


height:26px;


border-radius:50%;


transition:.2s;


box-shadow:

0 2px 8px rgba(0,0,0,.15);


}



.dot:hover{


transform:scale(1.15);


}



.dot.active{


outline:

3px solid rgba(0,0,0,.15);


outline-offset:3px;


}


</style>