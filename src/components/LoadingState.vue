<template>
  <div class="loading-state">
    <span class="spinner" />
    <span>正在加载更多壁纸</span>
  </div>
</template>

<style scoped>
.loading-state {
  min-height: 100px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 10px;

  color: #888;

  font-size: 13px;
}

.spinner {
  width: 16px;
  height: 16px;

  border: 2px solid rgba(127, 127, 127, 0.25);
  border-top-color: currentColor;

  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>