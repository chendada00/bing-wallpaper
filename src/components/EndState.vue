<template>
  <div class="end-state">
    <div class="end-line">
      <span />
      <span class="end-dot">✦</span>
      <span />
    </div>

    <div class="end-title">
      已经到底啦
    </div>

    <div class="end-text">
      这里已经是目前收录的全部壁纸
    </div>
  </div>
</template>

<style scoped>
.end-state {
  padding: 80px 20px 100px;

  text-align: center;
}

.end-line {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 12px;

  margin-bottom: 18px;
}

.end-line span:not(.end-dot) {
  width: 60px;
  height: 1px;

  background: rgba(127, 127, 127, 0.25);
}

.end-dot {
  color: #999;
  font-size: 14px;
}

.end-title {
  font-size: 14px;
  font-weight: 600;
}

.end-text {
  margin-top: 6px;

  font-size: 12px;

  color: #999;
}
</style>