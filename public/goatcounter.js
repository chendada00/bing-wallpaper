
(function () {
    'use strict'
  
    /**
     * 两个域名分别对应一个 GoatCounter 站点。
     *
     * 请替换为你在 GoatCounter 创建站点后得到的 code。
     */
    const SITES = {
      'bing.xn--xpqp35o.cn': {
        endpoint: 'https://bing.goatcounter.com/count',
      },
  
      'wall.xn--xpqp35o.cn': {
        endpoint: 'https://wall.goatcounter.com/count',
      },
    }
  
    const site = SITES[window.location.hostname]
  
    // 未配置的域名不加载统计服务。
    if (!site) return
  
    const endpoint = site.endpoint.replace(/\/+$/, '')
    const counterOrigin = endpoint.replace(/\/count$/, '')
  
    const CACHE_KEY =
      `goatcounter-stats:${window.location.hostname}`
  
    const CACHE_DURATION = 5 * 60 * 1000
  
    /**
     * 1. 加载 GoatCounter 官方统计脚本。
     *
     * 每次完整页面加载自动记录一次访问。
     */
    const tracker = document.createElement('script')
  
    tracker.async = true
    tracker.src = 'https://gc.zgo.at/count.js'
    tracker.setAttribute('data-goatcounter', endpoint)
  
    document.head.appendChild(tracker)
  
    /**
     * 日期格式化：YYYY-MM-DD
     */
    function formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
  
      return `${year}-${month}-${day}`
    }
  
    /**
     * 获取指定时间范围的日期。
     */
    function daysAgo(days) {
      const date = new Date()
      date.setDate(date.getDate() - days)
  
      return formatDate(date)
    }
  
    /**
     * 获取 GoatCounter 公开计数接口。
     *
     * TOTAL 是 GoatCounter 提供的特殊路径，
     * 表示整个站点的访问量，而不是首页访问量。
     */
    async function fetchCounter(params = {}) {
      const url = new URL(
        `${counterOrigin}/counter/TOTAL.json`
      )
  
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
  
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      })
  
      if (!response.ok) {
        throw new Error(
          `GoatCounter 请求失败：${response.status}`
        )
      }
  
      const result = await response.json()
  
      if (result.count === undefined || result.count === null) {
        throw new Error('GoatCounter 返回的数据格式异常')
      }
  
      return String(result.count)
    }
  
    /**
     * 从本地缓存读取数据。
     */
    function readCache() {
      try {
        const value = localStorage.getItem(CACHE_KEY)
  
        if (!value) return null
  
        const cache = JSON.parse(value)
  
        if (
          !cache.timestamp ||
          Date.now() - cache.timestamp > CACHE_DURATION
        ) {
          return null
        }
  
        return cache.data
      } catch {
        return null
      }
    }
  
    /**
     * 保存统计数据。
     */
    function saveCache(data) {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data,
          })
        )
      } catch {
        // 隐私模式或存储空间不足时，不影响页面使用。
      }
    }
  
    /**
     * 获取完整统计数据。
     */
    async function fetchStats() {
      const cached = readCache()
  
      if (cached) {
        return cached
      }
  
      const requests = await Promise.allSettled([
        // 网站从开始统计以来的累计访问量
        fetchCounter(),
  
        // 今天
        fetchCounter({
          start: formatDate(new Date()),
        }),
  
        // 最近 7 天
        fetchCounter({
          start: 'week',
        }),
  
        // 最近 30 天
        fetchCounter({
          start: daysAgo(29),
        }),
      ])
  
      const values = requests.map((item) => {
        return item.status === 'fulfilled'
          ? item.value
          : null
      })
  
      // 累计访问量获取失败，就不展示统计组件。
      if (values[0] === null) {
        throw new Error('无法获取累计访问量')
      }
  
      const data = {
        total: values[0],
        today: values[1] ?? '—',
        week: values[2] ?? '—',
        month: values[3] ?? '—',
      }
  
      saveCache(data)
  
      return data
    }
  
    let statsPromise = null
  
    function getStats() {
      if (!statsPromise) {
        statsPromise = fetchStats().catch((error) => {
          console.warn('[GoatCounter]', error)
          return null
        })
      }
  
      return statsPromise
    }
  
    /**
     * 更新单个统计组件。
     */
    function renderWidget(widget, data) {
      if (!data) return
  
      const fields = {
        total: data.total,
        today: data.today,
        week: data.week,
        month: data.month,
      }
  
      Object.entries(fields).forEach(([key, value]) => {
        const element = widget.querySelector(
          `[data-gc-${key}]`
        )
  
        if (element) {
          element.textContent = value
        }
      })
  
      widget.hidden = false
    }
  
    /**
     * 初始化交互。
     */
    function initWidget(widget) {
      if (widget.dataset.gcReady === 'true') {
        return
      }
  
      const trigger = widget.querySelector(
        '[data-gc-trigger]'
      )
  
      const panel = widget.querySelector(
        '[data-gc-panel]'
      )
  
      if (!trigger || !panel) return
  
      widget.dataset.gcReady = 'true'
  
      let closeTimer = null
  
      function setOpen(open) {
        panel.hidden = !open
        trigger.setAttribute(
          'aria-expanded',
          String(open)
        )
      }
  
      function cancelClose() {
        if (closeTimer) {
          clearTimeout(closeTimer)
          closeTimer = null
        }
      }
  
      function scheduleClose() {
        cancelClose()
  
        closeTimer = setTimeout(() => {
          setOpen(false)
        }, 160)
      }
  
      const supportsHover = window.matchMedia(
        '(hover: hover) and (pointer: fine)'
      ).matches
  
      if (supportsHover) {
        widget.addEventListener('pointerenter', (event) => {
          if (event.pointerType !== 'mouse') return
  
          cancelClose()
          setOpen(true)
        })
  
        widget.addEventListener('pointerleave', (event) => {
          if (event.pointerType !== 'mouse') return
  
          scheduleClose()
        })
      }
  
      // 手机端点击展开，桌面端点击也可以控制展开状态。
      trigger.addEventListener('click', () => {
        cancelClose()
        setOpen(panel.hidden)
      })
  
      widget.addEventListener('focusin', () => {
        cancelClose()
        setOpen(true)
      })
  
      widget.addEventListener('focusout', (event) => {
        if (!widget.contains(event.relatedTarget)) {
          scheduleClose()
        }
      })
  
      widget.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          trigger.focus()
        }
      })
  
      // 关闭时不保留展开状态。
      setOpen(false)
  
      getStats().then((data) => {
        renderWidget(widget, data)
      })
    }
  
    /**
     * 首页使用 Vue 动态挂载页脚。
     *
     * 因此不能只在脚本加载时查询一次 DOM，
     * 还要监听 Vue 后续创建的统计组件。
     */
    function initWidgets(root = document) {
      if (root.matches?.('[data-gc-widget]')) {
        initWidget(root)
      }
  
      root.querySelectorAll?.('[data-gc-widget]').forEach(
        initWidget
      )
    }
  
    initWidgets()
  
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            initWidgets(node)
          }
        })
      })
    })
  
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  })()
  