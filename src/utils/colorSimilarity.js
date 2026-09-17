/**
 * 颜色搜索工具
 */


/**
 * 快捷颜色
 */
export const COLOR_OPTIONS=[

    {
      name:'红色',
      value:'#e74c3c'
    },
  
    {
      name:'橙色',
      value:'#f39c12'
    },
  
    {
      name:'黄色',
      value:'#f1c40f'
    },
  
    {
      name:'绿色',
      value:'#27ae60'
    },
  
    {
      name:'青色',
      value:'#16a085'
    },
  
    {
      name:'蓝色',
      value:'#3498db'
    },
  
    {
      name:'紫色',
      value:'#8e44ad'
    },
  
    {
      name:'黑色',
      value:'#333333'
    },
  
    {
      name:'白色',
      value:'#eeeeee'
    }
  
  ]
  
  
  
  
  
  function hexToRgb(hex){
  
  
    if(
      typeof hex!=='string'
    ){
  
      return null
  
    }
  
  
    hex=hex.replace('#','')
  
  
    if(hex.length!==6){
  
      return null
  
    }
  
  
    const num=parseInt(
      hex,
      16
    )
  
  
    return {
  
      r:(num>>16)&255,
  
      g:(num>>8)&255,
  
      b:num&255
  
    }
  
  
  }
  
  
  
  
  
  function rgbToHsv(
   r,
   g,
   b
  ){
  
  
   r/=255
   g/=255
   b/=255
  
  
   const max=Math.max(
     r,g,b
   )
  
   const min=Math.min(
     r,g,b
   )
  
   const d=max-min
  
  
   let h=0
  
  
   if(d!==0){
  
  
     if(max===r){
  
       h=(g-b)/d
  
     }
     else if(max===g){
  
       h=2+(b-r)/d
  
     }
     else{
  
       h=4+(r-g)/d
  
     }
  
  
     h*=60
  
  
     if(h<0){
  
       h+=360
  
     }
  
   }
  
  
   const s=max===0
   ?0
   :d/max
  
  
  
   return {
  
     h,
  
     s,
  
     v:max
  
   }
  
  
  }
  
  
  
  
  
  function hsvDistance(
   a,
   b
  ){
  
  
   let h=Math.abs(
     a.h-b.h
   )
  
  
   h=Math.min(
     h,
     360-h
   )
  
  
   const s=Math.abs(
     a.s-b.s
   )
  
  
   const v=Math.abs(
     a.v-b.v
   )
  
  
  
   return (
  
     h*1.2
  
     +
  
     s*120
  
     +
  
     v*80
  
   )
  
  }
  
  
  
  
  
  function colorDistance(
   c1,
   c2
  ){
  
  
   const rgb1=hexToRgb(c1)
  
   const rgb2=hexToRgb(c2)
  
  
  
   if(!rgb1 || !rgb2){
  
     return 999
  
   }
  
  
   return hsvDistance(
  
     rgbToHsv(
       rgb1.r,
       rgb1.g,
       rgb1.b
     ),
  
     rgbToHsv(
       rgb2.r,
       rgb2.g,
       rgb2.b
     )
  
   )
  
  }
  
  
  
  
  /**
   * 获取图片颜色
   */
  function getColors(
   color
  ){
  
  
   if(!color){
  
     return []
  
   }
  
  
   return Object.entries(color)
  
  }
  
  
  
  
  
  /**
   * 获取颜色类型权重
   */
  function getTypeWeight(
   type,
   target
  ){
  
  
   const rgb=hexToRgb(
     target
   )
  
  
   if(!rgb){
  
     return 1
  
   }
  
  
   const hsv=rgbToHsv(
     rgb.r,
     rgb.g,
     rgb.b
   )
  
  
   /**
    * 鲜艳颜色
    */
   if(
     hsv.s>0.55
     &&
     hsv.v>0.45
   ){
  
  
     if(
      type==='Vibrant'
      ||
      type==='LightVibrant'
     ){
  
       return 0.7
  
     }
  
  
     if(
      type==='Muted'
      ||
      type==='DarkMuted'
     ){
  
       return 1.3
  
     }
  
  
   }
  
  
  
   /**
    * 深色
    */
   if(
     hsv.v<0.35
   ){
  
  
     if(
      type==='DarkVibrant'
      ||
      type==='DarkMuted'
     ){
  
      return 0.7
  
     }
  
  
   }
  
  
  
   return 1
  
  
  }
  
  
  
  
  
  /**
   * 获取壁纸和目标颜色距离
   */
  export function getColorDistance(
   imageColor,
   targetColor
  ){
  
  
   const colors=getColors(
     imageColor
   )
  
  
   if(colors.length===0){
  
     return 999
  
   }
  
  
  
   return Math.min(
  
     ...colors.map(([type,color])=>{
  
  
        return (
  
          colorDistance(
            color,
            targetColor
          )
  
          *
  
          getTypeWeight(
            type,
            targetColor
          )
  
        )
  
  
     })
  
   )
  
  
  }
  
  
  
  
  
  export function matchColor(
   imageColor,
   targetColor
  ){
  
  
   return (
  
    getColorDistance(
      imageColor,
      targetColor
    )
  
    <
  
    65
  
   )
  
  
  }