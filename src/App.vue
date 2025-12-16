<template>
  <div class="app-container">
    <!-- 顶部消息提示 -->
    <transition name="toast">
      <div v-if="error" class="toast toast-error">
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ error }}</span>
      </div>
      <div v-else-if="success" class="toast toast-success">
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ success }}</span>
      </div>
    </transition>
    
    <!-- 星空背景层 -->
    <div class="stars-background">
      <div class="stars-layer stars-layer-1"></div>
      <div class="stars-layer stars-layer-2"></div>
      <div class="stars-layer stars-layer-3"></div>
      <div class="particles-layer"></div>
      <div class="nebula-layer"></div>
      <!-- 闪烁的星星 -->
      <div class="twinkling-star twinkling-star-1"></div>
      <div class="twinkling-star twinkling-star-2"></div>
      <div class="twinkling-star twinkling-star-3"></div>
      <div class="twinkling-star twinkling-star-4"></div>
      <div class="twinkling-star twinkling-star-5"></div>
      <div class="twinkling-star twinkling-star-6"></div>
    </div>
    <div class="card">
      <div class="card-header">
        <h1 class="title">股票数据下载工具</h1>
        <p class="subtitle">快速获取股票实时数据并导出Excel</p>
      </div>
      
      <div class="form-section">
        <div class="form-row">
          <div class="form-group market-group">
            <label class="form-label">选择市场</label>
            <select v-model="selectedMarket" @change="onMarketChange" class="market-selector">
              <option value="A股">A股</option>
              <option value="美股">美股</option>
              <option value="港股">港股</option>
            </select>
          </div>
          
          <div class="form-group code-group">
            <label class="form-label">股票代码</label>
            <div class="input-with-btn">
              <div class="input-with-clear">
                <input
                  v-model="stockCode"
                  type="text"
                  class="stock-input"
                  :placeholder="getPlaceholder()"
                  @keyup.enter="searchAndAddStock"
                />
                <button 
                  v-if="stockCode" 
                  @click="clearStockCode" 
                  class="clear-btn"
                  type="button"
                  title="清空"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <button 
                @click="searchAndAddStock" 
                class="add-btn"
                :disabled="searching || !stockCode.trim()"
              >
                <span v-if="searching" class="btn-loading">
                  <span class="spinner"></span>
                </span>
                <span v-else class="btn-content">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>添加</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 股票列表区域 -->
      <div class="stock-list-section">
        <div class="list-header">
          <div class="list-header-left">
            <h3 class="list-title">股票列表（{{ selectedMarket }}）</h3>
            <span class="list-count">共 {{ filteredList.length }} 只</span>
          </div>
          <button 
            @click="refreshAllStocks" 
            class="refresh-btn"
            :disabled="refreshing || stockList.length === 0"
            :title="lastRefreshTime ? '上次刷新: ' + lastRefreshTime : '点击刷新数据'"
          >
            <svg class="refresh-icon" :class="{ spinning: refreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>{{ refreshing ? '刷新中...' : '刷新' }}</span>
          </button>
        </div>
        
        <div class="stock-list-container" v-if="filteredList.length > 0">
          <table class="stock-table">
            <thead>
              <tr>
                <th v-for="col in currentColumns" :key="col.key">{{ col.label }}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(stock, index) in paginatedList" :key="stock.code + stock.market">
                <td v-for="col in currentColumns" :key="col.key" :class="col.class || ''">
                  <span :class="col.colorClass ? getChangeClass(stock.changePercent) : ''">
                    {{ stock[col.key] || '-' }}
                  </span>
                </td>
                <td>
                  <button @click="removeStock(index)" class="remove-btn" title="删除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-list">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <p>暂无{{ selectedMarket }}股票，请搜索并添加</p>
        </div>

        <div class="list-actions" v-if="filteredList.length > 0">
          <!-- 分页放左侧，始终显示 -->
          <div class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
          </div>
          <div class="actions-right">
            <button @click="clearMarketStocks" class="clear-all-btn">
              清空{{ selectedMarket }}
            </button>
            <button 
              @click="downloadAllData" 
              class="download-btn"
              :disabled="downloading"
            >
              <span v-if="downloading" class="btn-loading">
                <span class="spinner"></span>
                <span>下载中...</span>
              </span>
              <span v-else class="btn-content">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>下载数据</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import ExcelJS from 'exceljs'

export default {
  name: 'App',
  data() {
    return {
      selectedMarket: 'A股',
      stockCode: '',
      searching: false,
      downloading: false,
      refreshing: false,
      autoRefreshing: false,
      error: '',
      success: '',
      stockList: [],
      currentPage: 1,
      pageSize: 10,
      messageTimer: null,
      refreshTimer: null,
      lastRefreshTime: null
    }
  },
  computed: {
    // 按当前市场筛选的列表
    filteredList() {
      return this.stockList.filter(stock => stock.market === this.selectedMarket)
    },
    totalPages() {
      return Math.ceil(this.filteredList.length / this.pageSize) || 1
    },
    paginatedList() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredList.slice(start, start + this.pageSize)
    },
    // 根据市场返回不同的列配置
    currentColumns() {
      const aShareColumns = [
        { key: 'code', label: '代码', class: 'col-code' },
        { key: 'name', label: '名称', class: 'col-name' },
        { key: 'price', label: '当前价' },
        { key: 'prevClose', label: '昨收' },
        { key: 'open', label: '今开' },
        { key: 'change', label: '涨跌额', colorClass: true },
        { key: 'changePercent', label: '涨跌幅', colorClass: true },
        { key: 'high', label: '最高' },
        { key: 'low', label: '最低' },
        { key: 'amplitude', label: '振幅' },
        { key: 'volume', label: '成交量' },
        { key: 'amount', label: '成交额' },
        { key: 'turnover', label: '换手率' }
      ]
      const usHkColumns = [
        { key: 'code', label: '代码', class: 'col-code' },
        { key: 'name', label: '名称', class: 'col-name' },
        { key: 'price', label: '当前价' },
        { key: 'prevClose', label: '昨收' },
        { key: 'open', label: '今开' },
        { key: 'change', label: '涨跌额', colorClass: true },
        { key: 'changePercent', label: '涨跌幅', colorClass: true },
        { key: 'high', label: '最高' },
        { key: 'low', label: '最低' },
        { key: 'amplitude', label: '振幅' },
        { key: 'volume', label: '成交量' },
        { key: 'amount', label: '成交额' }
      ]
      return this.selectedMarket === 'A股' ? aShareColumns : usHkColumns
    }
  },
  mounted() {
    this.loadStockList()
    this.startAutoRefresh()
  },
  beforeUnmount() {
    if (this.messageTimer) clearTimeout(this.messageTimer)
    this.stopAutoRefresh()
  },
  watch: {
    stockList: {
      handler(newList) {
        this.saveStockList()
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages || 1
        }
      },
      deep: true
    }
  },
  methods: {
    loadStockList() {
      try {
        const saved = localStorage.getItem('stockList')
        if (saved) {
          const list = JSON.parse(saved)
          // 数据迁移：从 rawData 补充缺失的字段
          this.stockList = list.map(stock => {
            if (stock.rawData && stock.rawData.length > 0) {
              const firstRow = stock.rawData[0]
              const getValue = (key) => {
                const val = firstRow[key]
                return (val !== undefined && val !== null && val !== '') ? val : '-'
              }
              return {
                ...stock,
                price: stock.price && stock.price !== '-' ? stock.price : getValue('当前价格'),
                prevClose: stock.prevClose && stock.prevClose !== '-' ? stock.prevClose : getValue('昨收'),
                open: stock.open && stock.open !== '-' ? stock.open : getValue('今日开盘价'),
                change: stock.change && stock.change !== '-' ? stock.change : getValue('涨跌额'),
                changePercent: stock.changePercent && stock.changePercent !== '-' ? stock.changePercent : getValue('涨跌幅'),
                high: stock.high && stock.high !== '-' ? stock.high : getValue('今日最高价'),
                low: stock.low && stock.low !== '-' ? stock.low : getValue('今日最低价'),
                amplitude: stock.amplitude && stock.amplitude !== '-' ? stock.amplitude : getValue('振幅'),
                volume: stock.volume && stock.volume !== '-' ? stock.volume : getValue('成交量(手)'),
                amount: stock.amount && stock.amount !== '-' ? stock.amount : getValue('金额'),
                turnover: stock.turnover && stock.turnover !== '-' ? stock.turnover : getValue('换手率')
              }
            }
            return stock
          })
        }
      } catch (e) {
        console.error('加载股票列表失败:', e)
      }
    },
    saveStockList() {
      try {
        localStorage.setItem('stockList', JSON.stringify(this.stockList))
      } catch (e) {
        console.error('保存股票列表失败:', e)
      }
    },
    showMessage(type, msg) {
      if (this.messageTimer) clearTimeout(this.messageTimer)
      if (type === 'success') {
        this.success = msg
        this.error = ''
      } else {
        this.error = msg
        this.success = ''
      }
      this.messageTimer = setTimeout(() => {
        this.success = ''
        this.error = ''
      }, 3000)
    },
    startAutoRefresh() {
      this.refreshTimer = setInterval(() => {
        this.autoRefreshStocks()
      }, 5000) // 5秒刷新一次
    },
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    // 自动刷新（静默，不影响按钮状态）
    async autoRefreshStocks() {
      if (this.stockList.length === 0 || this.autoRefreshing || this.refreshing) return
      
      this.autoRefreshing = true
      
      try {
        await this.doRefreshStocks()
      } finally {
        this.autoRefreshing = false
      }
    },
    // 手动刷新（显示按钮状态）
    async refreshAllStocks() {
      if (this.stockList.length === 0 || this.refreshing) return
      
      this.refreshing = true
      
      try {
        await this.doRefreshStocks()
      } finally {
        this.refreshing = false
      }
    },
    // 实际刷新逻辑
    async doRefreshStocks() {
      for (let i = 0; i < this.stockList.length; i++) {
        const stock = this.stockList[i]
        try {
          let stockData = null
          
          switch (stock.market) {
            case 'A股':
              stockData = await this.fetchAShareDataByCode(stock.code)
              break
            case '美股':
              stockData = await this.fetchUSStockDataByCode(stock.code)
              break
            case '港股':
              stockData = await this.fetchHKStockDataByCode(stock.code)
              break
          }
          
          if (stockData && stockData.length > 0) {
            const firstRow = stockData[0]
            const getValue = (key) => {
              const val = firstRow[key]
              return (val !== undefined && val !== null && val !== '') ? val : '-'
            }
            // 更新股票数据
            const updatedStock = {
              ...stock,
              price: getValue('当前价格'),
              prevClose: getValue('昨收'),
              open: getValue('今日开盘价'),
              change: getValue('涨跌额'),
              changePercent: getValue('涨跌幅'),
              high: getValue('今日最高价'),
              low: getValue('今日最低价'),
              amplitude: getValue('振幅'),
              volume: getValue('成交量(手)'),
              amount: getValue('金额'),
              rawData: stockData
            }
            // A股特有字段
            if (stock.market === 'A股') {
              updatedStock.turnover = getValue('换手率')
            }
            // 美股/港股特有字段
            if (stock.market === '美股' || stock.market === '港股') {
              updatedStock.volume = getValue('成交量')
              updatedStock.amount = getValue('成交额')
            }
            this.stockList[i] = updatedStock
          }
        } catch (err) {
          console.error(`刷新 ${stock.code} 失败:`, err)
        }
      }
      this.lastRefreshTime = new Date().toLocaleTimeString()
    },
    
    // 用于刷新的独立方法，不依赖 this.stockCode
    async fetchAShareDataByCode(code) {
      let marketPrefix = ''
      if (code.startsWith('6')) {
        marketPrefix = 'sh'
      } else if (code.startsWith('0') || code.startsWith('3')) {
        marketPrefix = 'sz'
      } else {
        return null
      }
      const fullCode = `${marketPrefix}${code}`
      
      // 获取实时数据（使用CORS代理，支持多个备选）
      let realTimeData = null
      const sinaUrl = `https://hq.sinajs.cn/list=${fullCode}`
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(sinaUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(sinaUrl)}`
      ]
      
      for (const proxyUrl of proxies) {
        try {
          const response = await axios.get(proxyUrl, { responseType: 'text', timeout: 10000 })
          if (response.data && !response.data.includes('FAILED')) {
            realTimeData = response.data
            break
          }
        } catch {}
      }
      
      if (!realTimeData) return null
      
      if (!realTimeData) return null
      
      // 刷新时只获取东方财富详细数据，不调用第三方API（避免频率限制）
      const detailData = await this.fetchAShareDetail(code, marketPrefix).catch(() => null)
      
      return this.parseAShareData(realTimeData, code, detailData, '', null)
    },
    
    async fetchUSStockDataByCode(code) {
      // 直接使用allorigins代理，避免本地代理403问题
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${code.toUpperCase()}?interval=1d&range=3mo`)}`
        const response = await axios.get(proxyUrl, { timeout: 15000 })
        if (response.data?.chart?.result?.[0]) {
          return this.parseUSStockData(response.data, code)
        }
        return null
      } catch {
        return null
      }
    },
    
    async fetchHKStockDataByCode(code) {
      const hkCode = code.replace(/^0+/, '').padStart(4, '0')
      const symbol = `${hkCode}.HK`
      // 直接使用allorigins代理，避免本地代理403问题
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`)}`
        const response = await axios.get(proxyUrl, { timeout: 15000 })
        if (response.data?.chart?.result?.[0]) {
          return this.parseHKStockData(response.data, code)
        }
        return null
      } catch {
        return null
      }
    },
    clearStockCode() {
      this.stockCode = ''
    },
    
    onMarketChange() {
      this.stockCode = ''
      this.currentPage = 1  // 切换市场时重置页码
    },
    
    getPlaceholder() {
      const placeholders = {
        'A股': '例如：000001（深市）或 600000（沪市）',
        '美股': '例如：AAPL、MSFT、TSLA',
        '港股': '例如：00700、09988'
      }
      return placeholders[this.selectedMarket]
    },

    getChangeClass(changePercent) {
      if (!changePercent) return ''
      const value = parseFloat(changePercent.replace('%', ''))
      if (value > 0) return 'up'
      if (value < 0) return 'down'
      return ''
    },

    async searchAndAddStock() {
      if (!this.stockCode.trim()) {
        this.showMessage('error', '请输入股票代码')
        return
      }

      // 检查是否已存在
      const exists = this.stockList.some(
        s => s.code === this.stockCode.trim().toUpperCase() && s.market === this.selectedMarket
      )
      if (exists) {
        this.showMessage('error', '该股票已在列表中')
        return
      }

      this.searching = true
      this.error = ''
      this.success = ''

      try {
        let stockData = null

        switch (this.selectedMarket) {
          case 'A股':
            stockData = await this.fetchAShareData()
            break
          case '美股':
            stockData = await this.fetchUSStockData()
            break
          case '港股':
            stockData = await this.fetchHKStockData()
            break
        }

        if (stockData && stockData.length > 0) {
          const firstRow = stockData[0]
          // 辅助函数：获取字段值，空字符串也显示为 '-'
          const getValue = (key) => {
            const val = firstRow[key]
            return (val !== undefined && val !== null && val !== '') ? val : '-'
          }
          const stockItem = {
            code: firstRow['股票代码'],
            name: firstRow['股票名称'] || this.stockCode.trim().toUpperCase(),
            market: this.selectedMarket,
            price: getValue('当前价格'),
            prevClose: getValue('昨收'),
            open: getValue('今日开盘价'),
            change: getValue('涨跌额'),
            changePercent: getValue('涨跌幅'),
            high: getValue('今日最高价'),
            low: getValue('今日最低价'),
            amplitude: getValue('振幅'),
            volume: getValue('成交量(手)'),
            amount: getValue('金额'),
            rawData: stockData
          }
          // A股特有字段
          if (this.selectedMarket === 'A股') {
            stockItem.turnover = getValue('换手率')
          }
          // 美股/港股特有字段
          if (this.selectedMarket === '美股' || this.selectedMarket === '港股') {
            stockItem.volume = getValue('成交量')
            stockItem.amount = getValue('成交额')
          }
          this.stockList.push(stockItem)
          this.showMessage('success', `已添加 ${firstRow['股票名称'] || this.stockCode}`)
          this.stockCode = ''
        } else {
          this.showMessage('error', '未获取到股票数据，请检查股票代码是否正确')
        }
      } catch (err) {
        this.showMessage('error', '获取数据失败：' + (err.message || '请检查网络连接和股票代码'))
      } finally {
        this.searching = false
      }
    },

    removeStock(pageIndex) {
      // 需要找到在原始 stockList 中的真实索引
      const filteredIndex = (this.currentPage - 1) * this.pageSize + pageIndex
      const stock = this.filteredList[filteredIndex]
      if (stock) {
        const realIndex = this.stockList.findIndex(s => s.code === stock.code && s.market === stock.market)
        if (realIndex !== -1) {
          this.stockList.splice(realIndex, 1)
        }
      }
    },

    clearMarketStocks() {
      // 只清空当前市场的股票
      this.stockList = this.stockList.filter(stock => stock.market !== this.selectedMarket)
      this.currentPage = 1
      this.success = ''
      this.error = ''
    },

    async downloadAllData() {
      if (this.filteredList.length === 0) {
        this.showMessage('error', `请先添加${this.selectedMarket}股票到列表`)
        return
      }

      this.downloading = true
      this.error = ''
      this.success = ''

      try {
        // 只下载当前市场的股票实时数据
        const allData = []
        for (const stock of this.filteredList) {
          if (stock.rawData && stock.rawData.length > 0) {
            allData.push(stock.rawData[0])
          }
        }

        if (allData.length > 0) {
          await this.exportToExcel(allData)
          this.showMessage('success', `成功下载 ${this.filteredList.length} 只${this.selectedMarket}股票数据！`)
        } else {
          this.showMessage('error', '没有可下载的数据')
        }
      } catch (err) {
        this.showMessage('error', '下载失败：' + (err.message || '请重试'))
      } finally {
        this.downloading = false
      }
    },

    async fetchAShareData() {
      const code = this.stockCode.trim()
      let marketPrefix = ''
      
      if (code.startsWith('6')) {
        marketPrefix = 'sh'
      } else if (code.startsWith('0') || code.startsWith('3')) {
        marketPrefix = 'sz'
      } else {
        throw new Error('A股代码格式不正确，沪市以6开头，深市以0或3开头')
      }

      const fullCode = `${marketPrefix}${code}`
      
      const fetchRealTimeData = async () => {
        const sinaUrl = `https://hq.sinajs.cn/list=${fullCode}`
        // 尝试多个CORS代理
        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(sinaUrl)}`,
          `https://corsproxy.io/?${encodeURIComponent(sinaUrl)}`
        ]
        
        for (const proxyUrl of proxies) {
          try {
            const response = await axios.get(proxyUrl, { responseType: 'text', timeout: 10000 })
            if (response.data && !response.data.includes('FAILED') && !response.data.includes('不存在')) {
              return response.data
            }
          } catch {}
        }
        throw new Error('股票代码不存在或数据获取失败')
      }

      const realTimeData = await fetchRealTimeData()
      
      const [detailData, industry, marketData] = await Promise.all([
        Promise.race([
          this.fetchAShareDetail(code, marketPrefix),
          new Promise((resolve) => setTimeout(() => resolve(null), 5000))
        ]).catch(() => null),
        Promise.race([
          this.fetchAShareIndustry(code),
          new Promise((resolve) => setTimeout(() => resolve(''), 3000))
        ]).catch(() => ''),
        Promise.race([
          this.fetchAShareMarketData(code),
          new Promise((resolve) => setTimeout(() => resolve(null), 3000))
        ]).catch(() => null)
      ])
      
      return this.parseAShareData(realTimeData, code, detailData, industry, marketData)
    },

    async fetchAShareIndustry(code) {
      try {
        const url = `https://api.mairuiapi.com/hszg/zg/${code}/92828F2B-B0C0-4DC1-8E13-762688E6F408`
        const response = await axios.get(url, { timeout: 5000 })
        
        if (response.data && Array.isArray(response.data)) {
          const industryItem = response.data.find(item => {
            return (item.code && item.code.startsWith('sw2_')) || 
                   (item.name && item.name.startsWith('A股-申万二级-'))
          })
          
          if (industryItem && industryItem.name) {
            return industryItem.name.replace('A股-申万二级-', '')
          }
        }
        return ''
      } catch (err) {
        return ''
      }
    },

    async fetchAShareMarketData(code) {
      try {
        const url = `https://api.mairuiapi.com/hsrl/ssjy/${code}/92828F2B-B0C0-4DC1-8E13-762688E6F408`
        const response = await axios.get(url, { timeout: 5000 })
        
        if (response.data) {
          return {
            priceChange: response.data.ud || 0,
            priceChangePercent: response.data.pc || 0,
            turnoverRate: response.data.hs || 0,

          }
        }
        return null
      } catch (err) {
        return null
      }
    },

    async fetchAShareDetail(code, marketPrefix) {
      try {
        const secid = `${marketPrefix === 'sh' ? '1' : '0'}.${code}`
        const fields = 'f43,f57,f58,f169,f170,f46,f44,f51,f168,f47,f164,f163,f116,f60,f45,f52,f50,f48,f167,f117,f71,f161,f49,f530,f135,f136,f104,f105,f162,f107,f19,f20,f21,f84,f85,f92,f127'
        const apiUrl = `https://push2.eastmoney.com/api/qt/stock/get?fltt=2&invt=2&secid=${secid}&fields=${fields}`
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`
        const proxyResponse = await axios.get(proxyUrl, { timeout: 10000 })
        return JSON.parse(proxyResponse.data.contents)
      } catch {
        return null
      }
    },

    parseAShareData(data, code, detailData = null, industryFromAPI = '', marketData = null) {
      if (!data || typeof data !== 'string') {
        throw new Error('数据为空或格式错误')
      }
      
      if (data.includes('FAILED') || data.includes('不存在') || data.includes('error')) {
        throw new Error('股票代码不存在或数据获取失败')
      }
      
      const match = data.match(/="([^"]+)"/)
      if (!match || !match[1]) {
        throw new Error('数据格式错误，无法解析')
      }

      const values = match[1].split(',')
      if (values.length < 6) {
        throw new Error('数据不完整，字段数量不足')
      }

      const currentPrice = parseFloat(values[3]) || 0
      const prevClose = parseFloat(values[2]) || 0
      const openPrice = parseFloat(values[1]) || 0
      const highPrice = parseFloat(values[4]) || 0
      const lowPrice = parseFloat(values[5]) || 0
      // 新浪API返回的是股数，需要除以100转换为手
      const volumeShares = parseFloat(values[8]) || 0
      const volumeHands = volumeShares / 100
      const amount = parseFloat(values[9]) || 0
      
      const avgPrice = volumeShares > 0 && amount > 0 ? (amount / volumeShares).toFixed(2) : currentPrice.toFixed(2)
      const amplitude = prevClose > 0 ? (((highPrice - lowPrice) / prevClose) * 100).toFixed(2) : '0.00'
      const limitUp = (prevClose * 1.1).toFixed(2)
      const limitDown = (prevClose * 0.9).toFixed(2)
      
      let industry = industryFromAPI || ''
      let totalShares = 0, tradableShares = 0, totalMarketValue = 0, tradableMarketValue = 0
      let dynamicPE = 0, staticPE = 0, peTTM = 0, PB = 0
      let avgPriceFromAPI = 0, volumeFromAPI = 0, amountFromAPI = 0
      let priceChange = 0, priceChangePercent = 0, turnoverRate = 0

      // 优先从东方财富API获取数据
      if (detailData && detailData.data) {
        const d = detailData.data
        totalShares = d.f84 || 0
        tradableShares = d.f85 || 0
        totalMarketValue = d.f116 || d.f104 || d.f20 || 0
        tradableMarketValue = d.f117 || d.f105 || d.f21 || 0
        dynamicPE = d.f162 || 0
        staticPE = d.f163 || 0
        peTTM = d.f164 || 0
        PB = d.f167 || 0
        avgPriceFromAPI = d.f71 || 0
        volumeFromAPI = d.f47 || 0
        amountFromAPI = d.f48 || 0
        
        if (d.f169) priceChange = d.f169
        if (d.f170) priceChangePercent = d.f170
        // 从东方财富API获取换手率
        if (d.f168 !== undefined && d.f168 !== null && d.f168 !== '-') {
          const tr = parseFloat(d.f168)
          if (!isNaN(tr) && tr > 0) turnoverRate = tr
        }
        // 从东方财富API获取行业（f127）
        if (!industry && d.f127) {
          industry = d.f127
        }
      }
      
      // 如果东方财富API没有数据，再从第三方API补充（但不使用量比数据）
      if (marketData) {
        if (!priceChange) priceChange = marketData.priceChange || 0
        if (!priceChangePercent) priceChangePercent = marketData.priceChangePercent || 0
        if (!turnoverRate) turnoverRate = marketData.turnoverRate || 0
      }

      const finalVolume = volumeFromAPI > 0 ? volumeFromAPI : volumeHands
      const finalAmount = amountFromAPI > 0 ? amountFromAPI : amount
      const finalAvgPrice = avgPriceFromAPI > 0 ? avgPriceFromAPI.toFixed(2) : avgPrice
      
      let finalPriceChange = priceChange !== 0 ? priceChange : (currentPrice - prevClose)
      // 确保 finalPriceChange 是数字
      if (typeof finalPriceChange !== 'number') {
        finalPriceChange = parseFloat(finalPriceChange) || 0
      }
      
      let finalPriceChangePercent = ''
      if (priceChangePercent !== 0 && priceChangePercent !== null && priceChangePercent !== undefined) {
        finalPriceChangePercent = typeof priceChangePercent === 'number' ? priceChangePercent.toFixed(2) + '%' : (priceChangePercent + '%')
      } else {
        finalPriceChangePercent = prevClose > 0 ? ((finalPriceChange / prevClose) * 100).toFixed(2) + '%' : '0.00%'
      }

      return [{
        '股票代码': code,
        '股票名称': values[0],
        '行业': industry || '',
        '日期': values[30] || new Date().toLocaleDateString(),
        '当前价格': currentPrice ? currentPrice.toFixed(2) : '',
        '昨收': prevClose ? prevClose.toFixed(2) : '',
        '涨跌额': finalPriceChange !== 0 ? Number(finalPriceChange).toFixed(2) : '',
        '涨跌幅': finalPriceChangePercent,
        '涨停': limitUp,
        '跌停': limitDown,
        '今日开盘价': openPrice ? openPrice.toFixed(2) : '',
        '今日最高价': highPrice ? highPrice.toFixed(2) : '',
        '今日最低价': lowPrice ? lowPrice.toFixed(2) : '',
        '均价': finalAvgPrice,
        '振幅': amplitude + '%',
        '成交量(手)': finalVolume > 0 ? this.formatNumber(finalVolume, true) : '',
        '金额': finalAmount > 0 ? this.formatNumber(finalAmount) : '',
        '总手': finalVolume > 0 ? this.formatNumber(finalVolume, true) : '',
        '换手率': turnoverRate > 0 ? turnoverRate.toFixed(2) + '%' : '',
        '总股本': totalShares > 0 ? this.formatNumber(totalShares) : '',
        '流通股本': tradableShares > 0 ? this.formatNumber(tradableShares) : '',
        '总市值': totalMarketValue > 0 ? this.formatNumber(totalMarketValue) : '',
        '流通市值': tradableMarketValue > 0 ? this.formatNumber(tradableMarketValue) : '',
        '动态市盈率': dynamicPE > 0 ? dynamicPE.toFixed(2) : '',
        '静态市盈率': staticPE > 0 ? staticPE.toFixed(2) : '',
        '市盈率(TTM)': peTTM > 0 ? peTTM.toFixed(2) : (staticPE > 0 ? staticPE.toFixed(2) : (dynamicPE > 0 ? dynamicPE.toFixed(2) : '')),
        '市净率': PB > 0 ? PB.toFixed(2) : '',
        '时间': values[31] || new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        '_change': finalPriceChange,
        '_changePercent': typeof priceChangePercent === 'number' ? priceChangePercent : (priceChangePercent !== 0 && priceChangePercent !== null && priceChangePercent !== undefined ? parseFloat(priceChangePercent.toString().replace('%', '')) : (prevClose > 0 ? ((finalPriceChange / prevClose) * 100) : 0)),
        '_prevClose': prevClose,
        '_close': currentPrice
      }]
    },

    async fetchUSStockData() {
      const symbol = this.stockCode.trim().toUpperCase()
      const directUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`
      const proxyResponse = await axios.get(proxyUrl, { timeout: 15000 })
      const data = JSON.parse(proxyResponse.data.contents)
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('未找到股票数据')
      }

      return this.parseUSStockData(data, symbol)
    },

    // 通用的Yahoo Finance数据解析方法（美股/港股共用）
    parseYahooStockData(data, code) {
      const result = data.chart.result[0]
      const meta = result.meta
      const quotes = result.indicators.quote[0]
      const timestamps = result.timestamp || []

      const currentPrice = meta.regularMarketPrice || 0
      
      let prevClose = meta.previousClose || meta.chartPreviousClose || 0
      if (!prevClose && timestamps.length > 0 && quotes.close && quotes.close.length > 0) {
        for (let i = quotes.close.length - 1; i >= 0; i--) {
          if (quotes.close[i] && quotes.close[i] > 0) {
            prevClose = quotes.close[i]
            break
          }
        }
      }
      
      let openPrice = meta.regularMarketOpen || 0
      if (!openPrice && quotes.open && quotes.open.length > 0) {
        for (let i = quotes.open.length - 1; i >= 0; i--) {
          if (quotes.open[i] && quotes.open[i] > 0) {
            openPrice = quotes.open[i]
            break
          }
        }
      }
      
      const highPrice = meta.regularMarketDayHigh || 0
      const lowPrice = meta.regularMarketDayLow || 0
      const volume = meta.regularMarketVolume || 0
      const amount = volume * currentPrice
      
      const change = currentPrice - prevClose
      const changePercent = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00'
      const amplitude = prevClose > 0 ? (((highPrice - lowPrice) / prevClose) * 100).toFixed(2) : '0.00'
      
      const marketTime = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : new Date()
      const date = marketTime.toLocaleDateString()
      const time = marketTime.toLocaleTimeString()
      
      return [{
        '股票代码': code,
        '股票名称': meta.longName || meta.shortName || code,
        '日期': date,
        '当前价格': currentPrice > 0 ? currentPrice.toFixed(2) : '',
        '昨收': prevClose > 0 ? prevClose.toFixed(2) : '',
        '涨跌额': change !== 0 ? change.toFixed(2) : '',
        '涨跌幅': changePercent + '%',
        '今日开盘价': openPrice > 0 ? openPrice.toFixed(2) : '',
        '今日最高价': highPrice > 0 ? highPrice.toFixed(2) : '',
        '今日最低价': lowPrice > 0 ? lowPrice.toFixed(2) : '',
        '振幅': amplitude + '%',
        '成交量': volume > 0 ? this.formatNumber(volume, true) : '',
        '成交额': amount > 0 ? this.formatNumber(amount) : '',
        '时间': time,
        '_change': change,
        '_changePercent': parseFloat(changePercent),
        '_prevClose': prevClose,
        '_close': currentPrice
      }]
    },

    parseUSStockData(data, symbol) {
      return this.parseYahooStockData(data, symbol)
    },

    async fetchHKStockData() {
      const code = this.stockCode.trim().padStart(5, '0')
      const symbol = `${code}.HK`
      const directUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`
      const proxyResponse = await axios.get(proxyUrl, { timeout: 15000 })
      const data = JSON.parse(proxyResponse.data.contents)
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('未找到股票数据')
      }

      return this.parseHKStockData(data, code)
    },

    parseHKStockData(data, code) {
      return this.parseYahooStockData(data, code)
    },

    formatNumber(num, isVolume = false) {
      if (num === 0 || num === null || num === undefined) return ''
      
      const absNum = Math.abs(num)
      
      if (absNum >= 100000000) {
        return (num / 100000000).toFixed(2) + '亿'
      } else if (absNum >= 10000) {
        return (num / 10000).toFixed(2) + '万'
      } else {
        return isVolume ? Math.round(num).toString() : num.toFixed(2)
      }
    },

    async exportToExcel(data) {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('股票数据')
      
      const columns = Object.keys(data[0]).filter(key => !key.startsWith('_'))
      
      worksheet.columns = columns.map(key => ({
        header: key,
        key: key,
        width: Math.max(12, Math.min(25, key.length + 2))
      }))
      
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FF000000' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
      headerRow.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
      
      data.forEach((row, rowIndex) => {
        const excelRow = worksheet.addRow(row)
        
        columns.forEach((col, colIndex) => {
          const cell = excelRow.getCell(colIndex + 1)
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          
          let fontColor = null
          
          if (col === '涨跌额') {
            const change = row['_change'] || 0
            if (change > 0) {
              fontColor = { argb: 'FFFF0000' }
            } else if (change < 0) {
              fontColor = { argb: 'FF00FF00' }
            }
          }
          
          if (col === '涨跌幅') {
            const changePercent = row['_changePercent'] || 0
            if (changePercent > 0) {
              fontColor = { argb: 'FFFF0000' }
            } else if (changePercent < 0) {
              fontColor = { argb: 'FF00FF00' }
            }
          }
          
          if (col === '当前价格' || col === '收盘价') {
            const currentPrice = parseFloat(row[col]) || 0
            const prevClose = row['_prevClose'] || 0
            if (currentPrice > prevClose && prevClose > 0) {
              fontColor = { argb: 'FFFF0000' }
            } else if (currentPrice < prevClose && prevClose > 0) {
              fontColor = { argb: 'FF00FF00' }
            }
          }
          
          if (fontColor) {
            cell.font = { color: fontColor }
          }
        })
      })
      
      const now = new Date()
      const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      const fileName = `${this.selectedMarket}_${timeStr}.xlsx`
      
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  height: 100vh;
  background: #0a0e27;
  position: relative;
  overflow: hidden;
}

.stars-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.nebula-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse 800px 600px at 20% 30%, rgba(102, 126, 234, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 700px 500px at 80% 70%, rgba(118, 75, 162, 0.15) 0%, transparent 55%),
    radial-gradient(ellipse 900px 700px at 50% 50%, rgba(59, 130, 246, 0.12) 0%, transparent 65%),
    radial-gradient(ellipse 600px 400px at 10% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 500px 600px at 90% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 55%);
  animation: nebulaPulse 20s ease-in-out infinite alternate;
  opacity: 0.7;
  filter: blur(1px);
}

@keyframes nebulaPulse {
  0% { opacity: 0.5; transform: scale(1) translate(0, 0); filter: blur(1px); }
  50% { opacity: 0.8; transform: scale(1.05) translate(2%, 1%); filter: blur(1.5px); }
  100% { opacity: 0.6; transform: scale(1.1) translate(-1%, 2%); filter: blur(1px); }
}

.particles-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(2px 2px at 60% 70%, rgba(102, 126, 234, 0.5), transparent),
    radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 80% 10%, rgba(118, 75, 162, 0.4), transparent),
    radial-gradient(2px 2px at 90% 40%, rgba(59, 130, 246, 0.4), transparent);
  background-size: 200% 200%;
  animation: particleFlow 30s linear infinite;
  opacity: 0.8;
}

@keyframes particleFlow {
  0% { background-position: 0% 0%, 100% 50%, 50% 100%, 0% 0%, 100% 100%; }
  50% { background-position: 100% 100%, 0% 0%, 0% 0%, 100% 100%, 0% 0%; }
  100% { background-position: 0% 0%, 100% 50%, 50% 100%, 0% 0%, 100% 100%; }
}

.stars-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  background-size: 200% 200%;
  animation: starsMove 100s linear infinite;
  opacity: 0.8;
}

.stars-layer-1 {
  background-image: 
    radial-gradient(1px 1px at 25% 25%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 50% 10%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 90% 40%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 70% 70%, rgba(255, 255, 255, 0.8), transparent);
  animation: starsMove 120s linear infinite;
}

.stars-layer-2 {
  background-image: 
    radial-gradient(2px 2px at 30% 20%, rgba(102, 126, 234, 0.8), transparent),
    radial-gradient(2px 2px at 70% 50%, rgba(118, 75, 162, 0.7), transparent),
    radial-gradient(2px 2px at 15% 70%, rgba(59, 130, 246, 0.8), transparent),
    radial-gradient(2px 2px at 85% 30%, rgba(102, 126, 234, 0.7), transparent);
  animation: starsMove 150s linear infinite reverse;
  opacity: 0.6;
}

.stars-layer-3 {
  background-image: 
    radial-gradient(0.5px 0.5px at 28% 32%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 52% 18%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 18% 28%, rgba(255, 255, 255, 0.6), transparent);
  animation: starsMove 180s linear infinite;
  opacity: 0.4;
}

@keyframes starsMove {
  0% { background-position: 0% 0%; opacity: 0.8; }
  50% { background-position: 100% 100%; opacity: 0.8; }
  100% { background-position: 0% 0%; opacity: 0.8; }
}

.twinkling-star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 3px rgba(255, 255, 255, 0.9), 0 0 6px rgba(255, 255, 255, 0.6);
  opacity: 0;
}

.twinkling-star-1 { top: 15%; left: 20%; animation: twinkle 4s ease-in-out infinite; }
.twinkling-star-2 { top: 35%; left: 75%; animation: twinkle 5s ease-in-out infinite 1.2s; }
.twinkling-star-3 { top: 60%; left: 15%; animation: twinkle 4.5s ease-in-out infinite 2.5s; }
.twinkling-star-4 { top: 25%; left: 85%; animation: twinkle 5.5s ease-in-out infinite 0.8s; }
.twinkling-star-5 { top: 75%; left: 65%; animation: twinkle 4.8s ease-in-out infinite 3.2s; }
.twinkling-star-6 { top: 50%; left: 45%; animation: twinkle 5.2s ease-in-out infinite 1.8s; }

@keyframes twinkle {
  0%, 100% { opacity: 0.1; transform: scale(0.8); }
  45% { opacity: 1; transform: scale(1.3); box-shadow: 0 0 6px rgba(255, 255, 255, 1), 0 0 12px rgba(102, 126, 234, 0.9); }
}

.card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  padding: 30px 40px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  width: calc(100vw - 40px);
  max-width: 1800px;
  height: calc(100vh - 40px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  animation: slideUp 0.5s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.title {
  color: #1a1a1a;
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 15px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

.form-row {
  display: flex;
  gap: 20px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.market-group {
  flex: 0 0 100px;
}

.code-group {
  flex: 0 0 320px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.input-with-btn {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-with-clear {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.market-selector {
  height: 32px;
  padding: 0 28px 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  color: #333;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  width: 100%;
}

.market-selector:hover { border-color: #667eea; cursor: pointer; }
.market-selector:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.12); }
.market-selector option { cursor: pointer; }

.stock-input {
  height: 32px;
  padding: 0 32px 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.3s;
  color: #333;
  background: white;
  width: 100%;
}

.stock-input:hover { border-color: #667eea; }
.stock-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.12); }

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: none;
  background: #e5e7eb;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.clear-btn svg { width: 10px; height: 10px; color: #666; }
.clear-btn:hover { background: #d1d5db; }

.add-btn {
  height: 32px;
  padding: 0 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) { opacity: 0.9; }
.add-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-icon { 
  width: 14px; 
  height: 14px; 
  flex-shrink: 0;
}

/* Toast 消息提示 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.toast-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.toast-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}



/* 股票列表区域 */
.stock-list-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.list-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.list-count {
  font-size: 14px;
  color: #666;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  color: #4f46e5;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #a5b4fc;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  width: 14px;
  height: 14px;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stock-list-container {
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stock-list-container .stock-table {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stock-list-container thead {
  flex-shrink: 0;
}

.stock-list-container tbody {
  flex: 1;
  overflow-y: auto;
  display: block;
}

.stock-list-container thead tr,
.stock-list-container tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.empty-list {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  color: #999;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.stock-table thead {
  background: #f3f4f6;
  position: sticky;
  top: 0;
}

.stock-table th {
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

.stock-table td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  color: #333;
}

.stock-table tbody tr:hover { background: #f3f4f6; }
.stock-table tbody tr:last-child td { border-bottom: none; }

.col-code { font-weight: 600; color: #667eea !important; }
.col-name { 
  max-width: 80px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
}
.col-high { color: #dc2626 !important; }
.col-low { color: #16a34a !important; }
.up { color: #dc2626 !important; font-weight: 500; }
.down { color: #16a34a !important; font-weight: 500; }

.stock-table td:last-child {
  text-align: center;
}

.stock-table td:last-child .remove-btn {
  margin: 0 auto;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-btn {
  padding: 4px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) { border-color: #667eea; color: #667eea; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.page-info {
  font-size: 12px;
  color: #666;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.remove-btn svg { width: 14px; height: 14px; color: #999; }
.remove-btn:hover { background: #fee2e2; }
.remove-btn:hover svg { color: #dc2626; }

.empty-icon { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5; }
.empty-list p { margin: 0; font-size: 14px; }

.list-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  flex-shrink: 0;
}

.list-actions .pagination {
  padding: 0;
  border: none;
  background: transparent;
}

.actions-right {
  display: flex;
  gap: 10px;
}

.clear-all-btn {
  height: 28px;
  padding: 0 12px;
  background: white;
  color: #666;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-all-btn:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }

.download-btn {
  height: 28px;
  padding: 0 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.download-btn:hover:not(:disabled) { opacity: 0.9; }
.download-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
