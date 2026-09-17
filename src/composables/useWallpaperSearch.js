import {
    computed,
    ref
  } from 'vue'
  
  import {
    matchColor
  } from '../utils/colorSimilarity'
  
  import {
    getColorDistance
  } from '../utils/colorSimilarity'
  export function useWallpaperSearch(items){
  
  
    const keyword = ref('')
  
    const date = ref('')
  
    const color = ref('')
  
  
  
    const searching = computed(()=>{
  
      return Boolean(
        keyword.value ||
        date.value ||
        color.value
      )
  
    })
  
  
  
    const result = computed(()=>{


        let list = items.value.filter(item=>{
      
      
          // 关键字搜索
          if(keyword.value){
      
            const text =
              (
                item.title +
                item.description
              ).toLowerCase()
      
      
            if(
              !text.includes(
                keyword.value.toLowerCase()
              )
            ){
      
              return false
      
            }
      
          }
      
      
      
          // 日期搜索
          if(date.value){
      
            if(
              !item.date.includes(
                date.value
              )
            ){
      
              return false
      
            }
      
          }
      
      
      
      
          //颜色搜索
      
          if(color.value){
      
      
            if(
              getColorDistance(
                item.color,
                color.value
              )
              >
              65
            ){
      
              return false
      
            }
      
      
          }
      
      
          return true
      
      
        })
      
      
      
      
        /**
         * 颜色搜索时按照相似度排序
         */
        if(color.value){
      
      
          list.sort(
            (a,b)=>{
      
      
              return (
      
                getColorDistance(
                  a.color,
                  color.value
                )
      
                -
      
                getColorDistance(
                  b.color,
                  color.value
                )
      
              )
      
      
            }
          )
      
      
        }
      
      
      
        return list
      
      
      })
  
  
  
    function clear(){
  
      keyword.value=''
      date.value=''
      color.value=''
  
    }
  
  
  
    return {
  
      keyword,
      date,
      color,
  
      result,
  
      searching,
  
      clear
  
    }
  
  
  }