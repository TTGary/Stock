<template>
  <div class="app-container">
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
        <div class="form-group">
          <label class="form-label">选择市场</label>
          <select v-model="selectedMarket" @change="onMarketChange" class="market-selector">
            <option value="A股">A股</option>
            <option value="美股">美股</option>
            <option value="港股">港股</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">股票代码</label>
          <div class="input-with-clear">
          <input
            v-model="stockCode"
            type="text"
            class="stock-input"
            :placeholder="getPlaceholder()"
            @keyup.enter="downloadData"
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
        </div>
        
        <button 
          @click="downloadData" 
          class="download-btn"
          :disabled="loading || !stockCode.trim()"
        >
          <span v-if="loading" class="btn-loading">
            <span class="spinner"></span>
            <span>下载中...</span>
          </span>
          <span v-else>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            下载数据
          </span>
        </button>
      </div>
      
      <transition name="message">
        <div v-if="error" class="message error-message">
          <svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ error }}</span>
        </div>
        <div v-else-if="success" class="message success-message">
          <svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{{ success }}</span>
        </div>
      </transition>
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
      loading: false,
      error: '',
      success: ''
    }
  },
  methods: {
    // 尝试多个CORS代理服务获取数据（改进版）
    async fetchWithCorsProxies(targetUrl, options = {}) {
      // 使用更可靠的代理服务列表
      const proxies = [
        // 代理1: allorigins.win (raw格式) - 最常用
        {
          name: 'allorigins-raw',
          getUrl: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          parseResponse: (response) => response.data
        },
        // 代理2: allorigins.win (get格式，返回JSON)
        {
          name: 'allorigins-get',
          getUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
          parseResponse: (response) => {
            if (response.data && typeof response.data === 'object' && response.data.contents) {
              return response.data.contents
            }
            return response.data
          }
        },
        // 代理3: cors-anywhere (需要请求权限，但更稳定)
        {
          name: 'cors-anywhere',
          getUrl: (url) => `https://cors-anywhere.herokuapp.com/${url}`,
          parseResponse: (response) => response.data
        },
        // 代理4: yacdn (另一个CORS代理)
        {
          name: 'yacdn',
          getUrl: (url) => `https://api.yacdn.org/proxy/${encodeURIComponent(url)}`,
          parseResponse: (response) => response.data
        },
      ]
      
      const defaultOptions = {
        responseType: 'text',
        timeout: 8000 // 减少超时时间，快速切换
      }
      const requestOptions = { ...defaultOptions, ...options }
      
      // 尝试每个代理
      const errors = []
      for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i]
        try {
          const proxyUrl = proxy.getUrl(targetUrl)
          const response = await axios.get(proxyUrl, requestOptions)
          
          // 解析响应
          const parsedData = proxy.parseResponse(response)
          return { ...response, data: parsedData }
        } catch (err) {
          errors.push(`${proxy.name}: ${err.message || '请求失败'}`)
          // 如果这是最后一个代理，抛出所有错误
          if (i === proxies.length - 1) {
            const errorMsg = `所有CORS代理都失败:\n${errors.join('\n')}`
            throw new Error(errorMsg)
          }
          // 否则继续尝试下一个代理（不等待，立即切换）
          continue
        }
      }
    },
    
    clearStockCode() {
      this.stockCode = ''
    },
    
    onMarketChange() {
      // 市场选择变化时清空股票代码
      this.stockCode = ''
    },
    
    getPlaceholder() {
      const placeholders = {
        'A股': '例如：000001（深市）或 600000（沪市）',
        '美股': '例如：AAPL、MSFT、TSLA',
        '港股': '例如：00700、09988'
      }
      return placeholders[this.selectedMarket]
    },
    
    async downloadData() {
      if (!this.stockCode.trim()) {
        this.error = '请输入股票代码'
        this.success = ''
        return
      }

      this.loading = true
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
            await this.exportToExcel(stockData)
          this.success = '数据下载成功！'
        } else {
          this.error = '未获取到股票数据，请检查股票代码是否正确'
        }
      } catch (err) {
        this.error = '获取数据失败：' + (err.message || '请检查网络连接和股票代码')
      } finally {
        this.loading = false
      }
    },

    async fetchAShareData() {
      // A股使用新浪财经API
      const code = this.stockCode.trim()
      let marketPrefix = ''
      
      // 判断是沪市还是深市
      if (code.startsWith('6')) {
        marketPrefix = 'sh' // 沪市
      } else if (code.startsWith('0') || code.startsWith('3')) {
        marketPrefix = 'sz' // 深市
      } else {
        throw new Error('A股代码格式不正确，沪市以6开头，深市以0或3开头')
      }

      const fullCode = `${marketPrefix}${code}`
      
      // 检测部署环境
      const isProduction = import.meta.env.PROD
      const isGitHubPages = isProduction && window.location.hostname.includes('github.io')
      const isEdgeOnePages = isProduction && (window.location.hostname.includes('edgeone.cool') || window.location.hostname.includes('edgeone.ai'))
      
      // 方法1: 使用API代理或CORS代理
      try {
        let response
        if (isGitHubPages) {
          // GitHub Pages环境：使用CORS代理（因为不支持Serverless Functions）
          response = await this.fetchWithCorsProxies(`https://hq.sinajs.cn/list=${fullCode}`, {
            responseType: 'text',
            timeout: 12000 // 12秒超时
          })
        } else {
          // EdgeOne Pages/Vercel/Netlify环境：使用API路由（边缘函数）
          try {
            response = await axios.get(`/api/sina?url=list=${fullCode}`, {
              responseType: 'arraybuffer', // 接收二进制数据
              timeout: 10000 // 10秒超时
            })
            
            // 处理边缘函数返回的 ArrayBuffer（新浪API使用GBK编码）
            let textData
            if (response.data instanceof ArrayBuffer) {
              // 尝试使用 GBK 解码
              try {
                // 注意：浏览器可能不支持 'gbk'，尝试 'gb2312' 或 'gb18030'
                const decoder = new TextDecoder('gb2312', { fatal: false })
                textData = decoder.decode(response.data)
                
                // 如果解码失败或包含乱码，尝试其他编码
                if (!textData || textData.includes('\ufffd')) {
                  try {
                    const decoder2 = new TextDecoder('gb18030', { fatal: false })
                    textData = decoder2.decode(response.data)
                  } catch (e2) {
                    // 如果还是失败，尝试 UTF-8（可能已经是UTF-8）
                    const decoder3 = new TextDecoder('utf-8', { fatal: false })
                    textData = decoder3.decode(response.data)
                  }
                }
              } catch (e) {
                // 如果 GBK 解码失败，尝试 UTF-8
                try {
                  const decoder = new TextDecoder('utf-8', { fatal: false })
                  textData = decoder.decode(response.data)
                } catch (e2) {
                  throw new Error('无法解码响应数据')
                }
              }
            } else if (typeof response.data === 'string') {
              // 如果已经是字符串，检查是否是错误响应
              if (response.data.startsWith('{') && response.data.includes('"error"')) {
                try {
                  const errorData = JSON.parse(response.data)
                  if (errorData.error) {
                    throw new Error(`边缘函数错误: ${errorData.error}`)
                  }
                } catch (e) {
                  // 如果不是JSON错误，继续处理
                }
              }
              textData = response.data
            } else {
              throw new Error('未知的响应格式')
            }
            
            // 将解码后的文本数据赋值给 response.data
            response.data = textData
          } catch (apiError) {
            // 如果是网络错误或超时，抛出更详细的错误
            if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
              throw new Error('边缘函数请求超时，请稍后重试')
            } else if (apiError.response && apiError.response.status === 500) {
              // 边缘函数返回500错误
              const errorMsg = apiError.response.data?.error || apiError.message
              throw new Error(`边缘函数错误: ${errorMsg}`)
            } else {
              throw apiError
            }
          }
        }
        if (!response.data || response.data.includes('FAILED') || response.data.includes('不存在')) {
          throw new Error('股票代码不存在或数据获取失败')
        }
        // 同时获取详细信息、行业信息和市场数据（不阻塞主流程）
        const [detailData, industry, marketData] = await Promise.all([
          Promise.race([
          this.fetchAShareDetail(code, marketPrefix),
          new Promise((resolve) => setTimeout(() => resolve(null), 8000)) // 8秒超时，给API更多时间
        ]).catch((err) => {
          console.warn('获取详细信息失败:', err.message)
          return null
          }),
          Promise.race([
            this.fetchAShareIndustry(code),
            new Promise((resolve) => setTimeout(() => resolve(''), 3000)) // 3秒超时
          ]).catch(() => {
            return ''
          }),
          Promise.race([
            this.fetchAShareMarketData(code),
            new Promise((resolve) => setTimeout(() => resolve(null), 3000)) // 3秒超时
          ]).catch(() => {
            return null
          })
        ])
        
        // 获取历史数据（29条）
        const historyData = await Promise.race([
          this.fetchAShareHistoryData(code, marketPrefix, 29),
          new Promise((resolve) => setTimeout(() => resolve([]), 5000)) // 5秒超时
        ]).catch(() => {
          return []
        })
        
        const currentData = this.parseAShareData(response.data, code, detailData, industry, marketData)
        // 将实时数据的基本信息填充到历史数据中
        const enrichedHistoryData = this.enrichHistoryData(historyData, currentData[0])
        // 合并当前数据和历史数据（当前数据在前，历史数据在后）
        return [...currentData, ...enrichedHistoryData]
      } catch (err1) {
        // 方法2: 备用方案（如果主方案失败）
        try {
          let response
          if (isGitHubPages) {
            // GitHub Pages：已经尝试过CORS代理，这里不再重复
            throw new Error('GitHub Pages环境：CORS代理已失败')
          } else if (isEdgeOnePages) {
            // EdgeOne Pages：边缘函数已失败，提供更详细的错误信息
            const errorMsg = err1.message || '未知错误'
            throw new Error(`EdgeOne Pages环境：边缘函数失败 (${errorMsg})。请检查：1. 边缘函数是否正确部署 2. 网络连接是否正常 3. 股票代码是否正确`)
          } else {
            // Vercel/Netlify：尝试CORS代理作为备用
            response = await this.fetchWithCorsProxies(`https://hq.sinajs.cn/list=${fullCode}`, {
              responseType: 'text',
              timeout: 8000 // 8秒超时
            })
          }
          if (!response.data || response.data.includes('FAILED') || response.data.includes('不存在')) {
            throw new Error('股票代码不存在或数据获取失败')
          }
          // 尝试获取详细信息、行业信息和市场数据，但不阻塞
          const [detailData, industry, marketData] = await Promise.all([
            Promise.race([
            this.fetchAShareDetail(code, marketPrefix),
            new Promise((resolve) => setTimeout(() => resolve(null), 5000)) // 5秒超时
          ]).catch(() => {
            return null
            }),
            Promise.race([
              this.fetchAShareIndustry(code),
              new Promise((resolve) => setTimeout(() => resolve(''), 3000)) // 3秒超时
            ]).catch(() => {
              return ''
            }),
            Promise.race([
              this.fetchAShareMarketData(code),
              new Promise((resolve) => setTimeout(() => resolve(null), 3000)) // 3秒超时
            ]).catch(() => {
              return null
            })
          ])
          
          // 获取历史数据（29条）
          const historyData = await Promise.race([
            this.fetchAShareHistoryData(code, marketPrefix, 29),
            new Promise((resolve) => setTimeout(() => resolve([]), 5000)) // 5秒超时
          ]).catch(() => {
            return []
          })
          
          const currentData = this.parseAShareData(response.data, code, detailData, industry, marketData)
          // 将实时数据的基本信息填充到历史数据中
          const enrichedHistoryData = this.enrichHistoryData(historyData, currentData[0])
          // 合并当前数据和历史数据（当前数据在前，历史数据在后）
          return [...currentData, ...enrichedHistoryData]
        } catch (err2) {
          throw new Error('获取A股数据失败，请检查股票代码是否正确: ' + (err2.message || ''))
        }
      }
    },

    async fetchAShareIndustry(code) {
      // 从API获取行业信息
      try {
        const url = `https://api.mairuiapi.com/hszg/zg/${code}/92828F2B-B0C0-4DC1-8E13-762688E6F408`
        const response = await axios.get(url, {
          timeout: 5000
        })
        
        if (response.data && Array.isArray(response.data)) {
          // 查找code以"sw2_"开头或name以"A股-申万二级-"开头的对象
          const industryItem = response.data.find(item => {
            return (item.code && item.code.startsWith('sw2_')) || 
                   (item.name && item.name.startsWith('A股-申万二级-'))
          })
          
          if (industryItem && industryItem.name) {
            // 提取行业名称，去掉"A股-申万二级-"前缀
            const industryName = industryItem.name.replace('A股-申万二级-', '')
            return industryName
          }
        }
        return ''
      } catch (err) {
        return ''
      }
    },

    async fetchAShareMarketData(code) {
      // 从API获取市场数据（涨跌额、涨跌幅、换手率、量比等）
      try {
        const url = `https://api.mairuiapi.com/hsrl/ssjy/${code}/92828F2B-B0C0-4DC1-8E13-762688E6F408`
        const response = await axios.get(url, {
          timeout: 5000
        })
        
        if (response.data) {
          // 根据API返回的数据结构解析字段
          // 字段映射：ud:涨跌额, pc:涨跌幅, hs:换手率, lb:量比
          const marketData = {
            priceChange: response.data.ud || 0, // 涨跌额(元)
            priceChangePercent: response.data.pc || 0, // 涨跌幅(%)
            turnoverRate: response.data.hs || 0, // 换手率(%)
            volumeRatio: response.data.lb || 0 // 量比
          }
          return marketData
        }
        return null
      } catch (err) {
        return null
      }
    },

    async fetchAShareDetail(code, marketPrefix) {
      // 从东方财富API获取完整的股票详细信息
      // 注意：由于API限制，可能无法获取所有字段，但不影响主流程
      try {
        // 清理股票代码，确保是纯数字
        const cleanCode = code.replace(/\./g, '').replace(/[^0-9]/g, '')
        const secid = `${marketPrefix === 'sh' ? '1' : '0'}.${cleanCode}`
        // 根据实际API返回数据，请求需要的字段
        // f84:总股本(股), f85:流通股本(股), f164:市盈率(TTM), f135:内盘(股), f136:外盘(股)
        const fields = 'f43,f57,f58,f169,f170,f46,f44,f51,f168,f47,f164,f163,f116,f60,f45,f52,f50,f48,f167,f117,f71,f161,f49,f530,f135,f136,f104,f105,f162,f107,f19,f20,f21,f84,f85,f92'
        
        // 尝试使用不同的API端点和参数格式
        // 方案1: 使用quote.eastmoney.com端点（可能更稳定）
        const url1 = `https://quote.eastmoney.com/${marketPrefix}${cleanCode}.html`
        // 方案2: 使用push2.eastmoney.com（标准格式）
        const directUrl1 = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fltt=2&invt=2&fields=${fields}`
        // 方案3: 使用push2his.eastmoney.com（历史数据API，可能包含基本信息）
        const directUrl2 = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=0&end=20500000&lmt=1`
        
        // 检测部署环境
        const isProduction = import.meta.env.PROD
        const isGitHubPages = isProduction && window.location.hostname.includes('github.io')
        
        // 如果是GitHub Pages，直接使用CORS代理（因为GitHub Pages不支持Serverless Functions）
        if (isGitHubPages) {
          // GitHub Pages环境：使用CORS代理，尝试多个API端点
          const urlsToTry = [
            directUrl1, // 标准格式
            `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fltt=2&invt=2&fields=${fields}&ut=fa5fd1943c7b386f172d6893dbfba10b`, // 带ut参数
            `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=${fields}`, // 简化格式
          ]
          
          for (const url of urlsToTry) {
            try {
              const proxyResponse = await this.fetchWithCorsProxies(url, {
                timeout: 10000
              })
              // 处理不同代理返回的数据格式
              let data
              if (typeof proxyResponse.data === 'string') {
                data = JSON.parse(proxyResponse.data)
              } else if (proxyResponse.data && proxyResponse.data.contents) {
                data = JSON.parse(proxyResponse.data.contents)
              } else {
                data = proxyResponse.data
              }
              // 检查返回码和数据
              if (data && data.rc === 0 && data.data) {
                return data
              } else if (data && data.data) {
                // 即使rc不是0，只要有data也返回
                return data
              }
            } catch (err) {
              // 继续尝试下一个URL
              continue
            }
          }
          console.warn('GitHub Pages环境：所有CORS代理方案都失败')
          return null
        } else {
          // Netlify/Vercel环境：使用API路由，尝试多个端点
          const apiEndpoints = [
            // 方案1: 标准格式（不带额外参数）
            `/api/eastmoney?url=api/qt/stock/get?secid=${secid}&fltt=2&invt=2&fields=${fields}`,
            // 方案2: 带ut参数
            `/api/eastmoney?url=api/qt/stock/get?secid=${secid}&fltt=2&invt=2&fields=${fields}&ut=fa5fd1943c7b386f172d6893dbfba10b`,
            // 方案3: 简化格式
            `/api/eastmoney?url=api/qt/stock/get?secid=${secid}&fields=${fields}`,
          ]
          
          for (const apiUrl of apiEndpoints) {
            try {
              const response = await axios.get(apiUrl, {
                timeout: 10000
              })
              
              if (response.data) {
                const apiResponse = response.data
                // 检查返回码
                if (apiResponse.rc === 0 && apiResponse.data) {
                  // 成功返回
                  return apiResponse
                } else if (apiResponse.rc === 102 || apiResponse.data === null || apiResponse.data === undefined) {
                  // rc: 102 表示参数错误，继续尝试下一个端点
                  console.warn(`API端点返回rc:102，尝试下一个: ${apiUrl}`)
                  continue
                } else if (apiResponse.data) {
                  // 有其他返回码但data存在（可能是其他成功码，如rc:1）
                  console.warn(`API返回非0返回码但data存在: rc=${apiResponse.rc}`)
                  return apiResponse
                }
              }
            } catch (err) {
              // 继续尝试下一个端点
              console.warn(`API端点请求失败: ${apiUrl}`, err.message)
              continue
            }
          }
        }
        
        // 所有方案都失败，返回null（不影响主流程）
        console.warn('所有获取详细信息的方案都失败，详细信息字段将无法获取')
        return null
      } catch (err) {
        console.warn('fetchAShareDetail错误:', err.message)
        return null
      }
    },

    async fetchAShareHistoryData(code, marketPrefix, limit = 29) {
      // 获取A股历史数据
      try {
        // 清理股票代码，去除末尾的点号和其他非数字字符（保留数字）
        const cleanCode = code.replace(/\./g, '').replace(/[^0-9]/g, '')
        const secid = `${marketPrefix === 'sh' ? '1' : '0'}.${cleanCode}`
        // 东方财富K线数据API
        const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=0&end=20500000&lmt=${limit}`
        
        try {
          // 直接使用完整URL
          const response = await axios.get(url, {
            timeout: 8000
          })
          if (response.data && response.data.data && response.data.data.klines) {
            return this.parseAShareHistoryData(response.data.data.klines, code)
          }
        } catch (err1) {
          return []
        }
      } catch (err) {
        return []
      }
      return []
    },

    parseAShareHistoryData(klines, code) {
      // 解析A股历史K线数据
      // 东方财富K线API返回格式：fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61
      // f51:日期, f52:开盘, f53:收盘, f54:最高, f55:最低, f56:成交量, f57:成交额, f58:振幅, f59:涨跌幅, f60:涨跌额, f61:换手率
      const historyData = []
      
      // 反转klines数组，让最新的数据在前面（因为API返回的是从旧到新）
      const reversedKlines = [...klines].reverse()
      
      for (let i = 0; i < reversedKlines.length && i < 29; i++) {
        const kline = reversedKlines[i]
        const values = kline.split(',')
        
        // 检查数据格式，至少需要日期字段
        if (values.length >= 1) {
          const date = values[0] || ''
          
          // 解析所有字段
          let open = 0, close = 0, low = 0, high = 0, volume = 0, amount = 0
          let amplitude = 0, changePercent = 0, change = 0, turnoverRate = 0
          
          if (values.length > 1 && values[1] !== '') open = parseFloat(values[1]) || 0
          if (values.length > 2 && values[2] !== '') close = parseFloat(values[2]) || 0
          if (values.length > 3 && values[3] !== '') high = parseFloat(values[3]) || 0
          if (values.length > 4 && values[4] !== '') low = parseFloat(values[4]) || 0
          if (values.length > 5 && values[5] !== '') volume = parseFloat(values[5]) || 0
          if (values.length > 6 && values[6] !== '') amount = parseFloat(values[6]) || 0
          if (values.length > 7 && values[7] !== '') amplitude = parseFloat(values[7]) || 0
          if (values.length > 8 && values[8] !== '') changePercent = parseFloat(values[8]) || 0
          if (values.length > 9 && values[9] !== '') change = parseFloat(values[9]) || 0
          if (values.length > 10 && values[10] !== '') turnoverRate = parseFloat(values[10]) || 0
          
          // 计算前一日收盘价（用于判断涨跌和颜色）
          let prevClose = close
          if (i < reversedKlines.length - 1) {
            const prevValues = reversedKlines[i + 1].split(',')
            if (prevValues.length > 2 && prevValues[2]) {
              prevClose = parseFloat(prevValues[2]) || 0
            }
          }
          
          // 如果收盘价为0但涨跌额不为0，尝试反推
          if (close === 0 && change !== 0 && prevClose > 0) {
            close = prevClose + change
          }
          
          // 构建历史数据对象，保持与实时数据相同的字段结构
          const historyRow = {
            '股票代码': code,
            '股票名称': '', // 历史数据不包含名称
            '行业': '', // 历史数据不包含行业
            '日期': date,
            '当前价格': !isNaN(close) && close > 0 ? close.toFixed(2) : '',
            '昨收': !isNaN(prevClose) && prevClose > 0 ? prevClose.toFixed(2) : '',
            '涨跌额': !isNaN(change) ? change.toFixed(2) : '',
            '涨跌幅': !isNaN(changePercent) ? changePercent.toFixed(2) + '%' : '',
            '涨停': '',
            '跌停': '',
            '今日开盘价': !isNaN(open) && open > 0 ? open.toFixed(2) : '',
            '今日最高价': !isNaN(high) && high > 0 ? high.toFixed(2) : '',
            '今日最低价': !isNaN(low) && low > 0 ? low.toFixed(2) : '',
            '均价': !isNaN(close) && close > 0 ? close.toFixed(2) : '',
            '振幅': !isNaN(amplitude) ? amplitude.toFixed(2) + '%' : '',
            '成交量(手)': !isNaN(volume) && volume > 0 ? this.formatNumber(volume, true) : '',
            '金额': !isNaN(amount) && amount > 0 ? this.formatNumber(amount) : '',
            '总手': !isNaN(volume) && volume > 0 ? this.formatNumber(volume, true) : '',
            '换手率': !isNaN(turnoverRate) ? turnoverRate.toFixed(2) + '%' : '',
            '量比': '',
            '总股本': '',
            '流通股本': '',
            '总市值': '',
            '流通市值': '',
            '动态市盈率': '',
            '静态市盈率': '',
            '市盈率(TTM)': '',
            '市净率': '',
            '时间': '',
            // 内部字段用于颜色判断
            '_change': change,
            '_changePercent': changePercent,
            '_close': close > 0 ? close : (prevClose > 0 ? prevClose + change : 0),
            '_prevClose': prevClose > 0 ? prevClose : (close > 0 ? close - change : 0)
          }
          
          historyData.push(historyRow)
        }
      }
      
      return historyData // 已经是正确的顺序（最新的在前面）
    },

    enrichHistoryData(historyData, currentData) {
      // 从实时数据中只复制真正不变的字段到历史数据中
      // 不进行任何计算或估算
      if (!currentData || !historyData || historyData.length === 0) {
        return historyData
      }

      // 只复制真正不变的字段（股票代码、股票名称、行业）
      const fieldsToCopy = [
        '股票代码',
        '股票名称',
        '行业'
      ]

      return historyData.map(historyRow => {
        const enrichedRow = { ...historyRow }
        
        // 只复制真正不变的信息
        fieldsToCopy.forEach(field => {
          if (currentData[field] !== undefined && currentData[field] !== '') {
            enrichedRow[field] = currentData[field]
          }
        })

        // 时间字段：历史数据使用日期格式（YYYY-MM-DD），与实时数据的时间格式区分
        enrichedRow['时间'] = enrichedRow['日期'] || ''

        // 其他无法获取历史数据的字段保持为空：
        // - 涨停、跌停
        // - 量比
        // - 总股本、流通股本
        // - 总市值、流通市值
        // - 动态市盈率、静态市盈率、市盈率(TTM)、市净率

        return enrichedRow
      })
    },

    parseAShareData(data, code, detailData = null, industryFromAPI = '', marketData = null) {
      // 新浪财经API返回格式：var hq_str_sh600000="股票名称,今日开盘价,昨日收盘价,当前价格,今日最高价,今日最低价,成交股数,成交金额,买一量,买一价,卖一量,卖一价,日期,时间";
      if (!data || typeof data !== 'string') {
        throw new Error('数据为空或格式错误')
      }
      
      // 检查是否包含错误信息
      if (data.includes('FAILED') || data.includes('不存在') || data.includes('error')) {
        throw new Error('股票代码不存在或数据获取失败')
      }
      
      const match = data.match(/="([^"]+)"/)
      if (!match || !match[1]) {
        throw new Error('数据格式错误，无法解析')
      }

      // 确保数据是UTF-8编码
      const dataStr = match[1]
      // 如果数据包含乱码，尝试修复编码
      const values = dataStr.split(',')
      if (values.length < 6) {
        throw new Error('数据不完整，字段数量不足')
      }
      
      // 确保股票名称正确编码（第一个字段）
      // 新浪API返回的数据可能是GBK编码，需要在前端处理
      if (values[0]) {
        // 尝试修复可能的编码问题
        try {
          // 如果字符串包含乱码，可能是GBK编码
          // 由于浏览器限制，我们只能尝试UTF-8修复
          // 真正的GBK到UTF-8转换需要在服务器端完成
          const stockName = values[0]
          // 检查是否包含乱码字符（常见的中文乱码模式）
          if (/[^\u0000-\u007F\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/.test(stockName) && 
              /[\u0080-\u00FF]/.test(stockName)) {
            // 可能包含编码问题，但浏览器无法直接转换GBK
            // 保持原值，让服务器端处理
            console.warn('检测到可能的编码问题，股票名称:', stockName)
          }
          values[0] = stockName
        } catch (e) {
          // 如果修复失败，保持原值
          console.warn('股票名称编码处理失败:', e)
        }
      }

      // 新浪财经API字段索引（A股）：
      // 0:股票名称, 1:今日开盘价, 2:昨日收盘价, 3:当前价格, 4:今日最高价, 5:今日最低价
      // 6:竞买价(买一价), 7:竞卖价(卖一价), 8:成交股数(手), 9:成交金额(元)
      // 10:买一量(手), 11:买一价, 12-19:买二到买五, 20:卖一量(手), 21:卖一价, 22-29:卖二到卖五
      // 30:日期, 31:时间
      const currentPrice = parseFloat(values[3]) || 0
      const prevClose = parseFloat(values[2]) || 0
      const openPrice = parseFloat(values[1]) || 0
      const highPrice = parseFloat(values[4]) || 0
      const lowPrice = parseFloat(values[5]) || 0
      const volumeHands = parseFloat(values[8]) || 0 // 成交股数（手），已经是手数了
      const amount = parseFloat(values[9]) || 0 // 成交金额（元）
      const buy1Volume = parseFloat(values[10]) || 0 // 买一量（手）
      const buy1Price = parseFloat(values[11]) || 0 // 买一价
      const sell1Volume = parseFloat(values[20]) || 0 // 卖一量（手）
      const sell1Price = parseFloat(values[21]) || 0 // 卖一价
      
      // 计算字段
      // 均价 = 成交金额 / 成交股数（股），成交股数 = 成交量手数 * 100
      const avgPrice = volumeHands > 0 && amount > 0 ? (amount / (volumeHands * 100)).toFixed(2) : currentPrice.toFixed(2)
      const amplitude = prevClose > 0 ? (((highPrice - lowPrice) / prevClose) * 100).toFixed(2) : '0.00' // 振幅
      const limitUp = (prevClose * 1.1).toFixed(2) // 涨停价（10%）
      const limitDown = (prevClose * 0.9).toFixed(2) // 跌停价（-10%）
      const totalHands = volumeHands // 总手 = 成交量（手）
      
      // 从东方财富API详细信息中提取完整字段
      // 优先使用API获取的行业信息，如果没有则使用东方财富API的行业代码
      let industry = industryFromAPI || ''
      let totalShares = 0
      let tradableShares = 0
      let totalMarketValue = 0
      let tradableMarketValue = 0
      let dynamicPE = 0
      let staticPE = 0
      let peTTM = 0 // 市盈率(TTM)，需要在if块外定义
      let PB = 0
      let avgPriceFromAPI = 0 // 从API获取的均价
      let volumeFromAPI = 0 // 从API获取的成交量
      let amountFromAPI = 0 // 从API获取的成交额
      let priceChange = 0 // 涨跌额
      let priceChangePercent = 0 // 涨跌幅
      let turnoverRate = 0 // 换手率
      let volumeRatio = 0 // 量比

      // 从新API获取市场数据（优先使用）
      if (marketData) {
        priceChange = marketData.priceChange || 0 // 涨跌额(元)
        priceChangePercent = marketData.priceChangePercent || 0 // 涨跌幅(%)
        turnoverRate = marketData.turnoverRate || 0 // 换手率(%)
        volumeRatio = marketData.volumeRatio || 0 // 量比(%)
      }

      // 检查detailData是否存在且有数据
      if (detailData && detailData.data) {
        // 处理不同的数据格式
        const d = detailData.data
        
        // 总股本 - f84是股数
        totalShares = d.f84 || 0
        
        // 流通股本 - f85是股数
        tradableShares = d.f85 || 0
        
        totalMarketValue = d.f116 || d.f104 || d.f20 || 0 // 总市值（元）
        tradableMarketValue = d.f117 || d.f105 || d.f21 || 0 // 流通市值（元）
        
        // 市盈率
        dynamicPE = d.f162 || 0 // 动态市盈率
        staticPE = d.f163 || 0 // 静态市盈率
        peTTM = d.f164 || 0 // 市盈率(TTM)
        
        PB = d.f167 || 0 // 市净率
        
        avgPriceFromAPI = d.f71 || 0 // 均价（直接使用）
        volumeFromAPI = d.f47 || 0 // 成交量（手）
        amountFromAPI = d.f48 || 0 // 成交额（元）
        
        // 如果新API没有提供涨跌额和涨跌幅，尝试使用东方财富API的数据作为备选
        if (!priceChange && d.f169) {
          priceChange = d.f169
        }
        if (!priceChangePercent && d.f170) {
          priceChangePercent = d.f170
        }
      } else {
        // detailData为空或数据不存在，这些字段将保持为0或空字符串
        console.warn('detailData为空或数据不存在，无法获取详细信息字段（总股本、流通股本等）')
      }

      // 优先使用东方财富API的数据，如果没有则使用新浪数据
      const finalVolume = volumeFromAPI > 0 ? volumeFromAPI : volumeHands
      const finalAmount = amountFromAPI > 0 ? amountFromAPI : amount
      const finalAvgPrice = avgPriceFromAPI > 0 ? avgPriceFromAPI.toFixed(2) : avgPrice
      
      // 计算涨跌额和涨跌幅（如果新API没有提供，则根据当前价和昨收计算）
      const finalPriceChange = priceChange !== 0 ? priceChange : (currentPrice - prevClose)
      let finalPriceChangePercent = ''
      if (priceChangePercent !== 0 && priceChangePercent !== null && priceChangePercent !== undefined) {
        // 新API返回的涨跌幅已经是百分比数值，直接使用
        finalPriceChangePercent = typeof priceChangePercent === 'number' ? priceChangePercent.toFixed(2) + '%' : (priceChangePercent + '%')
      } else {
        // 如果没有，则根据涨跌额计算
        finalPriceChangePercent = prevClose > 0 ? ((finalPriceChange / prevClose) * 100).toFixed(2) + '%' : '0.00%'
      }

      const result = [{
        '股票代码': code,
        '股票名称': values[0],
        '行业': industry || '', // 行业字段，即使为空也显示
        '日期': values[30] || new Date().toLocaleDateString(),
        '当前价格': currentPrice ? currentPrice.toFixed(2) : '',
        '昨收': prevClose ? prevClose.toFixed(2) : '',
        '涨跌额': finalPriceChange !== 0 ? finalPriceChange.toFixed(2) : '',
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
        '量比': volumeRatio > 0 ? volumeRatio.toFixed(2) : '',
        '总股本': totalShares > 0 ? this.formatNumber(totalShares) : '',
        '流通股本': tradableShares > 0 ? this.formatNumber(tradableShares) : '',
        '总市值': totalMarketValue > 0 ? this.formatNumber(totalMarketValue) : '',
        '流通市值': tradableMarketValue > 0 ? this.formatNumber(tradableMarketValue) : '',
        '动态市盈率': dynamicPE > 0 ? dynamicPE.toFixed(2) : '',
        '静态市盈率': staticPE > 0 ? staticPE.toFixed(2) : '',
        '市盈率(TTM)': peTTM > 0 ? peTTM.toFixed(2) : (staticPE > 0 ? staticPE.toFixed(2) : (dynamicPE > 0 ? dynamicPE.toFixed(2) : '')),
        '市净率': PB > 0 ? PB.toFixed(2) : '',
        '时间': values[31] || new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        // 内部字段用于颜色判断
        '_change': finalPriceChange,
        '_changePercent': typeof priceChangePercent === 'number' ? priceChangePercent : (priceChangePercent !== 0 && priceChangePercent !== null && priceChangePercent !== undefined ? parseFloat(priceChangePercent.toString().replace('%', '')) : (prevClose > 0 ? ((finalPriceChange / prevClose) * 100) : 0)),
        '_prevClose': prevClose,
        '_close': currentPrice
      }]

      return result
    },

    async fetchUSStockData() {
      // 美股使用Yahoo Finance API（数据最丰富）
      const symbol = this.stockCode.trim().toUpperCase()
      // 检测部署环境
      const isProduction = import.meta.env.PROD
      const isGitHubPages = isProduction && window.location.hostname.includes('github.io')
      const directUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`
      
      try {
        let response
        if (isGitHubPages) {
          // GitHub Pages环境：使用CORS代理
          response = await this.fetchWithCorsProxies(directUrl, { timeout: 12000 })
          // 解析返回的数据
          const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
          
          if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('未找到股票数据')
          }
          
          const result = this.parseUSStockData(data, symbol)
          // 获取历史数据（29条）
          const historyData = this.parseUSStockHistoryData(data, symbol)
          // 合并当前数据和历史数据（当前数据在前，历史数据在后）
          return [...result, ...historyData]
        } else {
          // Netlify/Vercel环境：使用API路由
          const apiUrl = `/api/yahoo?url=v8/finance/chart/${symbol}?interval=1d&range=3mo`
          response = await axios.get(apiUrl, { timeout: 10000 })
          const data = response.data
          
          if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('未找到股票数据')
          }

          const result = this.parseUSStockData(data, symbol)
          // 获取历史数据（29条）
          const historyData = this.parseUSStockHistoryData(data, symbol)
          // 合并当前数据和历史数据（当前数据在前，历史数据在后）
          return [...result, ...historyData]
        }
      } catch (err1) {
        // 方法2: 直接调用（备用方案）
        try {
          const response = await axios.get(directUrl, { timeout: 10000 })
          const data = response.data
          
          if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('未找到股票数据')
          }

          const result = this.parseUSStockData(data, symbol)
          // 获取历史数据（29条）
          const historyData = this.parseUSStockHistoryData(data, symbol)
          // 合并当前数据和历史数据（当前数据在前，历史数据在后）
          return [...result, ...historyData]
        } catch (err2) {
          // 方法3: 再次尝试CORS代理（备用方案）
          const proxyResponse = await this.fetchWithCorsProxies(directUrl, { timeout: 8000 })
          // 处理不同代理返回的数据格式
          let data
          if (typeof proxyResponse.data === 'string') {
            data = JSON.parse(proxyResponse.data)
          } else if (proxyResponse.data && proxyResponse.data.contents) {
            data = JSON.parse(proxyResponse.data.contents)
          } else {
            data = proxyResponse.data
          }
          
          if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('未找到股票数据')
          }

          const result = this.parseUSStockData(data, symbol)
          // 获取历史数据（29条）
          const historyData = this.parseUSStockHistoryData(data, symbol)
          // 合并当前数据和历史数据（当前数据在前，历史数据在后）
          return [...result, ...historyData]
        }
      }
    },

    parseUSStockData(data, symbol) {
      const result = data.chart.result[0]
      const meta = result.meta
      const quotes = result.indicators.quote[0]
      const timestamps = result.timestamp || []

      // 提取Yahoo Finance API实际返回的数据
      const currentPrice = meta.regularMarketPrice || 0
      
      // 尝试多种方式获取昨收价
      let prevClose = meta.previousClose || 0
      if (!prevClose && meta.chartPreviousClose) {
        prevClose = meta.chartPreviousClose
      }
      // 如果还是没有，尝试从历史数据中获取前一个交易日的收盘价
      if (!prevClose && timestamps.length > 0 && quotes.close && quotes.close.length > 0) {
        // 获取当前时间戳
        const currentTime = meta.regularMarketTime || Date.now() / 1000
        // 找到前一个交易日的收盘价（不是当天的）
        for (let i = quotes.close.length - 1; i >= 0; i--) {
          if (quotes.close[i] && quotes.close[i] > 0 && timestamps[i] && timestamps[i] < currentTime) {
            // 确保不是当天的数据
            const dataDate = new Date(timestamps[i] * 1000).toDateString()
            const currentDate = new Date(currentTime * 1000).toDateString()
            if (dataDate !== currentDate) {
              prevClose = quotes.close[i]
              break
            }
          }
        }
        // 如果还是没找到，使用最后一个有效的收盘价
        if (!prevClose) {
          for (let i = quotes.close.length - 1; i >= 0; i--) {
            if (quotes.close[i] && quotes.close[i] > 0) {
              prevClose = quotes.close[i]
              break
            }
          }
        }
      }
      
      // 尝试多种方式获取开盘价
      let openPrice = meta.regularMarketOpen || 0
      if (!openPrice && quotes.open && quotes.open.length > 0) {
        // 获取当天的开盘价（第一个有效值，通常是当天的第一个数据点）
        const currentTime = meta.regularMarketTime || Date.now() / 1000
        const currentDate = new Date(currentTime * 1000).toDateString()
        
        // 先找当天的第一个开盘价
        for (let i = 0; i < quotes.open.length; i++) {
          if (quotes.open[i] && quotes.open[i] > 0 && timestamps[i]) {
            const dataDate = new Date(timestamps[i] * 1000).toDateString()
            if (dataDate === currentDate) {
              openPrice = quotes.open[i]
              break
            }
          }
        }
        // 如果没找到当天的，使用最后一个有效值
        if (!openPrice) {
          for (let i = quotes.open.length - 1; i >= 0; i--) {
            if (quotes.open[i] && quotes.open[i] > 0) {
              openPrice = quotes.open[i]
              break
            }
          }
        }
      }
      
      const highPrice = meta.regularMarketDayHigh || 0
      const lowPrice = meta.regularMarketDayLow || 0
      const volume = meta.regularMarketVolume || 0
      const amount = volume * currentPrice
      
      // 计算字段
      const change = currentPrice - prevClose
      const changePercent = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00'
      const amplitude = prevClose > 0 ? (((highPrice - lowPrice) / prevClose) * 100).toFixed(2) : '0.00'
      const avgPrice = volume > 0 ? (amount / volume).toFixed(2) : currentPrice.toFixed(2)
      
      // 市值和股本数据（只有当API返回有效值时才使用）
      const totalShares = (meta.sharesOutstanding && meta.sharesOutstanding > 0) ? meta.sharesOutstanding : 0
      const tradableShares = (meta.floatShares && meta.floatShares > 0) ? meta.floatShares : (totalShares > 0 ? totalShares : 0)
      const totalMarketValue = (meta.marketCap && meta.marketCap > 0) ? meta.marketCap : (currentPrice > 0 && totalShares > 0 ? (currentPrice * totalShares) : 0)
      
      // 财务指标（只有当API返回有效值时才使用，检查字段是否存在）
      const trailingPE = (meta.trailingPE !== undefined && meta.trailingPE !== null && meta.trailingPE > 0) ? meta.trailingPE : 0
      const forwardPE = (meta.forwardPE !== undefined && meta.forwardPE !== null && meta.forwardPE > 0) ? meta.forwardPE : 0
      const PB = (meta.priceToBook !== undefined && meta.priceToBook !== null && meta.priceToBook > 0) ? meta.priceToBook : 0
      const dividendYield = (meta.dividendYield !== undefined && meta.dividendYield !== null && meta.dividendYield > 0) ? (meta.dividendYield * 100) : 0
      const trailingEps = (meta.trailingEps !== undefined && meta.trailingEps !== null && meta.trailingEps !== 0) ? meta.trailingEps : 0
      const beta = (meta.beta !== undefined && meta.beta !== null && meta.beta !== 0) ? meta.beta : 0
      const fiftyTwoWeekHigh = (meta.fiftyTwoWeekHigh !== undefined && meta.fiftyTwoWeekHigh !== null && meta.fiftyTwoWeekHigh > 0) ? meta.fiftyTwoWeekHigh : 0
      const fiftyTwoWeekLow = (meta.fiftyTwoWeekLow !== undefined && meta.fiftyTwoWeekLow !== null && meta.fiftyTwoWeekLow > 0) ? meta.fiftyTwoWeekLow : 0
      
      // 时间信息
      const marketTime = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : new Date()
      const date = marketTime.toLocaleDateString()
      const time = marketTime.toLocaleTimeString()
      
      // 构建数据对象，只包含有数据的字段
      const stockData = {
        '股票代码': symbol,
        '股票名称': meta.longName || meta.shortName || symbol,
        '日期': date,
        '时间': time,
        '当前价格': currentPrice > 0 ? currentPrice.toFixed(2) : '',
        '昨收': prevClose > 0 ? prevClose.toFixed(2) : '',
        '涨跌额': change !== 0 ? change.toFixed(2) : '',
        '涨跌幅': changePercent + '%',
        '今日开盘价': openPrice > 0 ? openPrice.toFixed(2) : '',
        '今日最高价': highPrice > 0 ? highPrice.toFixed(2) : '',
        '今日最低价': lowPrice > 0 ? lowPrice.toFixed(2) : '',
        '均价': avgPrice,
        '振幅': amplitude + '%',
        '成交量': volume > 0 ? this.formatNumber(volume) : '',
        '成交额': amount > 0 ? this.formatNumber(amount) : ''
      }
      
      // 只添加有数据的可选字段
      if (meta.exchangeName) stockData['交易所'] = meta.exchangeName
      if (meta.currency && meta.currency !== 'USD') stockData['货币'] = meta.currency
      if (fiftyTwoWeekHigh > 0) stockData['52周最高'] = fiftyTwoWeekHigh.toFixed(2)
      if (fiftyTwoWeekLow > 0) stockData['52周最低'] = fiftyTwoWeekLow.toFixed(2)
      if (totalShares > 0) stockData['总股本'] = this.formatNumber(totalShares)
      if (tradableShares > 0 && tradableShares !== totalShares) stockData['流通股本'] = this.formatNumber(tradableShares)
      if (totalMarketValue > 0) stockData['总市值'] = this.formatNumber(totalMarketValue)
      if (trailingPE > 0) stockData['市盈率(TTM)'] = trailingPE.toFixed(2)
      if (forwardPE > 0) stockData['前瞻市盈率'] = forwardPE.toFixed(2)
      if (PB > 0) stockData['市净率'] = PB.toFixed(2)
      if (dividendYield > 0) stockData['股息率'] = dividendYield.toFixed(2) + '%'
      if (trailingEps !== 0 && trailingEps !== null && trailingEps !== undefined) stockData['每股收益(TTM)'] = trailingEps.toFixed(2)
      if (beta !== 0 && beta !== null && beta !== undefined) stockData['贝塔系数'] = beta.toFixed(2)
      if (meta.sector && meta.sector.trim()) stockData['行业'] = meta.sector
      if (meta.industry && meta.industry.trim()) stockData['细分行业'] = meta.industry

      // 添加内部字段用于颜色判断
      stockData['_change'] = change
      stockData['_changePercent'] = parseFloat(changePercent)
      stockData['_prevClose'] = prevClose
      stockData['_close'] = currentPrice

      return [stockData]
    },

    parseUSStockHistoryData(data, symbol) {
      // 解析美股历史数据（从Yahoo Finance API的chart数据中提取）
      const result = data.chart.result[0]
      const quotes = result.indicators.quote[0]
      const timestamps = result.timestamp || []
      const meta = result.meta

      const historyData = []
      
      // 获取当前数据的基本信息（用于填充历史数据）
      const stockName = meta.longName || meta.shortName || symbol
      const sector = meta.sector || ''
      const industry = meta.industry || ''

      // 从历史数据中提取最近29条（排除当前数据）
      if (timestamps && quotes && quotes.close && quotes.close.length > 0) {
        const validData = []
        
        // 收集所有有效的历史数据点
        for (let i = 0; i < timestamps.length && i < quotes.close.length; i++) {
          if (quotes.close[i] && quotes.close[i] > 0 && timestamps[i]) {
            validData.push({
              timestamp: timestamps[i],
              open: quotes.open && quotes.open[i] ? quotes.open[i] : quotes.close[i],
              close: quotes.close[i],
              high: quotes.high && quotes.high[i] ? quotes.high[i] : quotes.close[i],
              low: quotes.low && quotes.low[i] ? quotes.low[i] : quotes.close[i],
              volume: quotes.volume && quotes.volume[i] ? quotes.volume[i] : 0
            })
          }
        }
        
        // 取最近29条（排除当前数据，从倒数第二条开始）
        const historyCount = Math.min(29, validData.length - 1)
        for (let i = validData.length - 2; i >= 0 && historyData.length < historyCount; i--) {
          const data = validData[i]
          const prevData = validData[i + 1]
          const change = data.close - prevData.close
          const changePercent = prevData.close > 0 ? ((change / prevData.close) * 100) : 0
          const date = new Date(data.timestamp * 1000)
          const amount = data.volume * data.close
          const avgPrice = data.close.toFixed(2)
          const amplitude = prevData.close > 0 ? (((data.high - data.low) / prevData.close) * 100) : 0
          
          historyData.push({
            '股票代码': symbol,
            '股票名称': stockName,
            '行业': sector,
            '日期': date.toLocaleDateString('zh-CN'),
            '时间': date.toLocaleDateString('zh-CN'), // 历史数据使用日期格式
            '当前价格': data.close.toFixed(2),
            '昨收': prevData.close.toFixed(2),
            '涨跌额': change.toFixed(2),
            '涨跌幅': changePercent.toFixed(2) + '%',
            '今日开盘价': data.open.toFixed(2),
            '今日最高价': data.high.toFixed(2),
            '今日最低价': data.low.toFixed(2),
            '均价': avgPrice,
            '振幅': amplitude.toFixed(2) + '%',
            '成交量': data.volume > 0 ? this.formatNumber(data.volume) : '',
            '成交额': amount > 0 ? this.formatNumber(amount) : '',
            // 无法获取历史数据的字段保持为空
            '交易所': '',
            '货币': '',
            '52周最高': '',
            '52周最低': '',
            '总股本': '',
            '流通股本': '',
            '总市值': '',
            '市盈率(TTM)': '',
            '前瞻市盈率': '',
            '市净率': '',
            '股息率': '',
            '每股收益(TTM)': '',
            '贝塔系数': '',
            '细分行业': '',
            // 内部字段用于颜色判断
            '_change': change,
            '_changePercent': changePercent,
            '_close': data.close,
            '_prevClose': prevData.close
          })
        }
      }
      
      // 反转历史数据，让最新的在前面
      historyData.reverse()
      
      return historyData
    },


    async fetchHKStockData() {
      // 港股使用东方财富API（数据最详细）
      const code = this.stockCode.trim().padStart(5, '0')
      const secid = `116.${code}` // 港股secid格式：116.00700
      const fields = 'f43,f57,f58,f169,f170,f46,f44,f51,f168,f47,f164,f163,f116,f60,f45,f52,f50,f48,f167,f117,f71,f161,f49,f530,f135,f136,f104,f105,f162,f107,f19,f20,f21,f84,f85,f92'
      // 检测部署环境
      const isProduction = import.meta.env.PROD
      const isGitHubPages = isProduction && window.location.hostname.includes('github.io')
      const directUrl = `https://push2.eastmoney.com/api/qt/stock/get?fltt=2&invt=2&secid=${secid}&fields=${fields}`
      
      try {
        let response
        if (isGitHubPages) {
          // GitHub Pages环境：使用CORS代理
          const proxyResponse = await this.fetchWithCorsProxies(directUrl, {
            timeout: 10000
          })
          // 处理不同代理返回的数据格式
          let data
          if (typeof proxyResponse.data === 'string') {
            data = JSON.parse(proxyResponse.data)
          } else if (proxyResponse.data && proxyResponse.data.contents) {
            data = JSON.parse(proxyResponse.data.contents)
          } else {
            data = proxyResponse.data
          }
          response = { data: data }
        } else {
          // Netlify/Vercel环境：使用API路由
          const apiUrl = `/api/eastmoney?url=api/qt/stock/get?fltt=2&invt=2&secid=${secid}&fields=${fields}`
          response = await axios.get(apiUrl, {
            timeout: 8000
          })
        }
        
        if (response.data && response.data.data) {
          const result = this.parseHKStockDataFromEastMoney(response.data, code)
          // 获取历史数据（29条）
          const historyData = await Promise.race([
            this.fetchHKStockHistoryData(code, 29),
            new Promise((resolve) => setTimeout(() => resolve([]), 5000)) // 5秒超时
          ]).catch(() => {
            return []
          })
          // 合并当前数据和历史数据
          const enrichedHistoryData = this.enrichHKHistoryData(historyData, result[0])
          return [...result, ...enrichedHistoryData]
        } else {
          throw new Error('数据格式错误：响应数据为空')
        }
      } catch (err1) {
          // 方法2: 直接调用
          try {
            const directUrl = `https://push2.eastmoney.com/api/qt/stock/get?fltt=2&invt=2&secid=${secid}&fields=${fields}`
            const response = await axios.get(directUrl, { timeout: 8000 })
            if (response.data && response.data.data) {
              const result = this.parseHKStockDataFromEastMoney(response.data, code)
              // 获取历史数据（29条）
              const historyData = await Promise.race([
                this.fetchHKStockHistoryData(code, 29),
                new Promise((resolve) => setTimeout(() => resolve([]), 5000)) // 5秒超时
              ]).catch(() => {
                return []
              })
              // 合并当前数据和历史数据
              const enrichedHistoryData = this.enrichHKHistoryData(historyData, result[0])
              return [...result, ...enrichedHistoryData]
            } else {
              throw new Error('数据格式错误：响应数据为空')
            }
            } catch (err2) {
              // 方法3: 再次尝试CORS代理（备用方案）
              try {
                const proxyResponse = await this.fetchWithCorsProxies(directUrl, { timeout: 8000 })
                // 处理不同代理返回的数据格式
                let data
                if (typeof proxyResponse.data === 'string') {
                  data = JSON.parse(proxyResponse.data)
                } else if (proxyResponse.data && proxyResponse.data.contents) {
                  data = JSON.parse(proxyResponse.data.contents)
                } else {
                  data = proxyResponse.data
                }
              if (data && data.data) {
                const result = this.parseHKStockDataFromEastMoney(data, code)
                // 获取历史数据（29条）
                const historyData = await Promise.race([
                  this.fetchHKStockHistoryData(code, 29),
                  new Promise((resolve) => setTimeout(() => resolve([]), 5000)) // 5秒超时
                ]).catch(() => {
                  return []
                })
                // 合并当前数据和历史数据
                const enrichedHistoryData = this.enrichHKHistoryData(historyData, result[0])
                return [...result, ...enrichedHistoryData]
              } else {
                throw new Error('数据格式错误：响应数据为空')
              }
            } catch (err3) {
              throw new Error(`获取港股数据失败：${err3.message || '请检查股票代码是否正确'}`)
            }
          }
        }
    },


    parseHKStockDataFromEastMoney(data, code) {
      // 解析东方财富港股数据（主数据源）
      if (!data || !data.data) {
        throw new Error('港股数据格式错误：API返回的数据为空或不完整')
      }
      
      // 检查数据是否有效
      const d = data.data
      if (!d.f43 && !d.f58) {
        throw new Error('港股数据无效：股票代码可能不存在或数据不完整')
      }

      // 港股价格字段已经是实际价格，不需要除以100
      const currentPrice = d.f43 ? d.f43 : 0
      const prevClose = d.f60 ? d.f60 : 0
      const openPrice = d.f46 ? d.f46 : 0
      const highPrice = d.f44 ? d.f44 : 0
      const lowPrice = d.f45 ? d.f45 : 0
      const volume = d.f47 || 0
      const amount = d.f48 || 0
      const avgPrice = d.f71 || 0
      const totalShares = d.f84 || 0
      const tradableShares = d.f85 || 0
      const totalMarketValue = d.f116 || d.f104 || d.f20 || 0
      const tradableMarketValue = d.f117 || d.f105 || d.f21 || 0
      const peTTM = d.f164 || 0
      const PB = d.f167 || 0
      const industry = d.f107 ? this.getIndustryName(d.f107) : ''

      const change = currentPrice - prevClose
      const changePercent = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00'
      const amplitude = prevClose > 0 ? (((highPrice - lowPrice) / prevClose) * 100).toFixed(2) : '0.00'
      
      return [{
        '股票代码': code,
        '股票名称': d.f58 || code,
        '行业': industry,
        '日期': new Date().toLocaleDateString('zh-CN'),
        '时间': new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        '当前价格': currentPrice ? currentPrice.toFixed(2) : '',
        '昨收': prevClose ? prevClose.toFixed(2) : '',
        '涨跌额': change ? change.toFixed(2) : '',
        '涨跌幅': changePercent + '%',
        '今日开盘价': openPrice ? openPrice.toFixed(2) : '',
        '今日最高价': highPrice ? highPrice.toFixed(2) : '',
        '今日最低价': lowPrice ? lowPrice.toFixed(2) : '',
        '均价': avgPrice > 0 ? avgPrice.toFixed(2) : '',
        '振幅': amplitude + '%',
        '成交量': volume > 0 ? this.formatNumber(volume, true) : '',
        '成交额': amount > 0 ? this.formatNumber(amount) : '',
        '总股本': totalShares > 0 ? this.formatNumber(totalShares) : '',
        '流通股本': tradableShares > 0 ? this.formatNumber(tradableShares) : '',
        '总市值': totalMarketValue > 0 ? this.formatNumber(totalMarketValue) : '',
        '流通市值': tradableMarketValue > 0 ? this.formatNumber(tradableMarketValue) : '',
        '市盈率(TTM)': peTTM > 0 ? peTTM.toFixed(2) : '',
        '市净率': PB > 0 ? PB.toFixed(2) : '',
        // 内部字段用于颜色判断
        '_change': change,
        '_changePercent': parseFloat(changePercent),
        '_prevClose': prevClose,
        '_close': currentPrice
      }]
    },

    async fetchHKStockHistoryData(code, limit = 29) {
      // 获取港股历史数据
      try {
        const secid = `116.${code}` // 港股secid格式：116.00700
        const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=0&end=20500000&lmt=${limit}`
        
        try {
          const response = await axios.get(url, {
            timeout: 8000
          })
          if (response.data && response.data.data && response.data.data.klines) {
            return this.parseHKStockHistoryData(response.data.data.klines, code)
          }
        } catch (err1) {
          return []
        }
      } catch (err) {
        return []
      }
      return []
    },

    parseHKStockHistoryData(klines, code) {
      // 解析港股历史K线数据
      const historyData = []
      
      // 反转klines数组，让最新的数据在前面
      const reversedKlines = [...klines].reverse()
      
      for (let i = 0; i < reversedKlines.length && i < 29; i++) {
        const kline = reversedKlines[i]
        const values = kline.split(',')
        
        if (values.length >= 1) {
          const date = values[0] || ''
          
          // 解析所有字段
          let open = 0, close = 0, low = 0, high = 0, volume = 0, amount = 0
          let amplitude = 0, changePercent = 0, change = 0, turnoverRate = 0
          
          if (values.length > 1 && values[1] !== '') open = parseFloat(values[1]) || 0
          if (values.length > 2 && values[2] !== '') close = parseFloat(values[2]) || 0
          if (values.length > 3 && values[3] !== '') high = parseFloat(values[3]) || 0
          if (values.length > 4 && values[4] !== '') low = parseFloat(values[4]) || 0
          if (values.length > 5 && values[5] !== '') volume = parseFloat(values[5]) || 0
          if (values.length > 6 && values[6] !== '') amount = parseFloat(values[6]) || 0
          if (values.length > 7 && values[7] !== '') amplitude = parseFloat(values[7]) || 0
          if (values.length > 8 && values[8] !== '') changePercent = parseFloat(values[8]) || 0
          if (values.length > 9 && values[9] !== '') change = parseFloat(values[9]) || 0
          if (values.length > 10 && values[10] !== '') turnoverRate = parseFloat(values[10]) || 0
          
          // 计算前一日收盘价
          let prevClose = close
          if (i < reversedKlines.length - 1) {
            const prevValues = reversedKlines[i + 1].split(',')
            if (prevValues.length > 2 && prevValues[2]) {
              prevClose = parseFloat(prevValues[2]) || 0
            }
          }
          
          if (close === 0 && change !== 0 && prevClose > 0) {
            close = prevClose + change
          }
          
          // 构建历史数据对象
          const historyRow = {
            '股票代码': code,
            '股票名称': '',
            '行业': '',
            '日期': date,
            '时间': date, // 历史数据使用日期格式
            '当前价格': !isNaN(close) && close > 0 ? close.toFixed(2) : '',
            '昨收': !isNaN(prevClose) && prevClose > 0 ? prevClose.toFixed(2) : '',
            '涨跌额': !isNaN(change) ? change.toFixed(2) : '',
            '涨跌幅': !isNaN(changePercent) ? changePercent.toFixed(2) + '%' : '',
            '今日开盘价': !isNaN(open) && open > 0 ? open.toFixed(2) : '',
            '今日最高价': !isNaN(high) && high > 0 ? high.toFixed(2) : '',
            '今日最低价': !isNaN(low) && low > 0 ? low.toFixed(2) : '',
            '均价': !isNaN(close) && close > 0 ? close.toFixed(2) : '',
            '振幅': !isNaN(amplitude) ? amplitude.toFixed(2) + '%' : '',
            '成交量': !isNaN(volume) && volume > 0 ? this.formatNumber(volume) : '',
            '成交额': !isNaN(amount) && amount > 0 ? this.formatNumber(amount) : '',
            // 无法获取历史数据的字段保持为空
            '总股本': '',
            '流通股本': '',
            '总市值': '',
            '流通市值': '',
            '市盈率(TTM)': '',
            '市净率': '',
            // 内部字段用于颜色判断
            '_change': change,
            '_changePercent': changePercent,
            '_close': close > 0 ? close : (prevClose > 0 ? prevClose + change : 0),
            '_prevClose': prevClose > 0 ? prevClose : (close > 0 ? close - change : 0)
          }
          
          historyData.push(historyRow)
        }
      }
      
      return historyData
    },

    enrichHKHistoryData(historyData, currentData) {
      // 从实时数据中只复制真正不变的字段到历史数据中
      if (!currentData || !historyData || historyData.length === 0) {
        return historyData
      }

      const fieldsToCopy = [
        '股票代码',
        '股票名称',
        '行业'
      ]

      return historyData.map(historyRow => {
        const enrichedRow = { ...historyRow }
        
        fieldsToCopy.forEach(field => {
          if (currentData[field] !== undefined && currentData[field] !== '') {
            enrichedRow[field] = currentData[field]
          }
        })

        return enrichedRow
      })
    },

    formatNumber(num, isHands = false) {
      if (!num || num === 0) return '0'
      
      // 如果是手数，需要特殊处理
      if (isHands) {
        // 手数单位：1手 = 100股
        if (num >= 100000000) {
          return (num / 100000000).toFixed(2) + '亿'
        } else if (num >= 10000) {
          return (num / 10000).toFixed(2) + '万'
        } else {
          return num.toLocaleString()
        }
      }
      
      // 金额单位：元
      if (num >= 100000000) {
        return (num / 100000000).toFixed(2) + '亿'
      } else if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万'
      } else {
        return num.toLocaleString()
      }
    },

    getIndustryName(code) {
      // 行业代码映射表（常见行业）
      const industryMap = {
        1: '银行',
        2: '保险',
        3: '证券',
        4: '房地产',
        5: '建筑',
        6: '钢铁',
        7: '煤炭',
        8: '石油',
        9: '化工',
        10: '医药',
        11: '汽车',
        12: '电子',
        13: '通信',
        14: '计算机',
        15: '传媒',
        16: '电力',
        17: '公用事业',
        18: '交通运输',
        19: '商贸零售',
        20: '食品饮料',
        21: '纺织服装',
        22: '轻工制造',
        23: '家电',
        24: '农林牧渔',
        25: '采掘',
        26: '有色金属',
        27: '机械',
        28: '国防军工',
        29: '综合',
        30: '环保'
      }
      return industryMap[code] || '其他'
    },

    async exportToExcel(data) {
      // 创建工作簿（确保UTF-8编码）
      const workbook = new ExcelJS.Workbook()
      // 设置工作簿属性，确保支持UTF-8
      workbook.creator = '股票数据下载工具'
      workbook.created = new Date()
      const worksheet = workbook.addWorksheet('股票数据')
      
      // 获取列名数组（排除内部使用的字段）
      const columns = Object.keys(data[0]).filter(key => !key.startsWith('_'))
      
      // 设置表头
      worksheet.columns = columns.map(key => ({
        header: key,
        key: key,
        width: Math.max(12, Math.min(25, key.length + 2))
      }))
      
      // 设置表头样式
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
      
      // 添加数据行（确保UTF-8编码）
      data.forEach((row, rowIndex) => {
        // 确保所有字符串值都是UTF-8编码
        const encodedRow = {}
        Object.keys(row).forEach(key => {
          if (!key.startsWith('_')) {
            const value = row[key]
            // 确保字符串值正确编码
            if (typeof value === 'string') {
              encodedRow[key] = value
            } else {
              encodedRow[key] = value
            }
          }
        })
        const excelRow = worksheet.addRow(encodedRow)
        
        // 为每个单元格设置样式
        columns.forEach((col, colIndex) => {
          const cell = excelRow.getCell(colIndex + 1)
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          
          // 根据字段类型和数据值设置颜色
          let fontColor = null
          
          // 涨跌额字段：涨用红色，跌用绿色
          if (col === '涨跌额') {
            const change = row['_change'] || 0
            if (change > 0) {
              fontColor = { argb: 'FFFF0000' } // 红色（涨）
            } else if (change < 0) {
              fontColor = { argb: 'FF00FF00' } // 绿色（跌）
            }
          }
          
          // 涨跌幅字段：涨用红色，跌用绿色
          if (col === '涨跌幅') {
            const changePercent = row['_changePercent'] || 0
            if (changePercent > 0) {
              fontColor = { argb: 'FFFF0000' } // 红色（涨）
            } else if (changePercent < 0) {
              fontColor = { argb: 'FF00FF00' } // 绿色（跌）
            }
          }
          
          // 当前价格、收盘价：相对于前一日，涨红跌绿
          if (col === '当前价格' || col === '收盘价') {
            const currentPrice = parseFloat(row[col]) || 0
            const prevClose = row['_prevClose'] || 0
            if (currentPrice > prevClose && prevClose > 0) {
              fontColor = { argb: 'FFFF0000' } // 红色（涨）
            } else if (currentPrice < prevClose && prevClose > 0) {
              fontColor = { argb: 'FF00FF00' } // 绿色（跌）
            }
          }
          
          // 设置字体颜色
          if (fontColor) {
            cell.font = { color: fontColor }
          }
        })
      })
      
      // 生成文件名
      const fileName = `${this.selectedMarket}_${this.stockCode}_${new Date().toISOString().split('T')[0]}.xlsx`
      
      // 导出文件（确保UTF-8编码）
      const buffer = await workbook.xlsx.writeBuffer()
      // 确保文件名使用UTF-8编码
      const encodedFileName = encodeURIComponent(fileName)
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // 使用UTF-8编码的文件名
      link.setAttribute('download', fileName)
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
  align-items: flex-start;
  padding: 40px 20px;
  min-height: 100vh;
  background: #0a0e27;
  position: relative;
  overflow: hidden;
}

/* 星空背景容器 */
.stars-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

/* 星云层 - 科幻光效 */
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
  0% {
    opacity: 0.5;
    transform: scale(1) translate(0, 0);
    filter: blur(1px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05) translate(2%, 1%);
    filter: blur(1.5px);
  }
  100% {
    opacity: 0.6;
    transform: scale(1.1) translate(-1%, 2%);
    filter: blur(1px);
  }
}

/* 粒子流动层 */
.particles-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(2px 2px at 60% 70%, rgba(102, 126, 234, 0.5), transparent),
    radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 80% 10%, rgba(118, 75, 162, 0.4), transparent),
    radial-gradient(2px 2px at 90% 40%, rgba(59, 130, 246, 0.4), transparent),
    radial-gradient(1px 1px at 33% 80%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(2px 2px at 10% 60%, rgba(102, 126, 234, 0.5), transparent),
    radial-gradient(1px 1px at 45% 25%, rgba(139, 92, 246, 0.3), transparent),
    radial-gradient(2px 2px at 75% 85%, rgba(99, 102, 241, 0.4), transparent),
    radial-gradient(1px 1px at 15% 55%, rgba(255, 255, 255, 0.3), transparent);
  background-size: 200% 200%;
  background-position: 0% 0%, 100% 50%, 50% 100%, 0% 0%, 100% 100%, 50% 0%, 0% 50%, 75% 25%, 25% 75%, 90% 10%;
  animation: particleFlow 30s linear infinite;
  opacity: 0.8;
}

@keyframes particleFlow {
  0% {
    background-position: 0% 0%, 100% 50%, 50% 100%, 0% 0%, 100% 100%, 50% 0%, 0% 50%;
  }
  50% {
    background-position: 100% 100%, 0% 0%, 0% 0%, 100% 100%, 0% 0%, 100% 100%, 50% 50%;
  }
  100% {
    background-position: 0% 0%, 100% 50%, 50% 100%, 0% 0%, 100% 100%, 50% 0%, 0% 50%;
  }
}

/* 星星层 - 三层不同大小的星星 */
.stars-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(1px 1px at 25% 25%, white, transparent),
    radial-gradient(1px 1px at 50% 10%, white, transparent),
    radial-gradient(1px 1px at 20% 30%, white, transparent),
    radial-gradient(1px 1px at 90% 40%, white, transparent),
    radial-gradient(1px 1px at 70% 70%, white, transparent),
    radial-gradient(1px 1px at 30% 60%, white, transparent),
    radial-gradient(1px 1px at 80% 80%, white, transparent),
    radial-gradient(1px 1px at 10% 90%, white, transparent),
    radial-gradient(1px 1px at 60% 20%, white, transparent),
    radial-gradient(1px 1px at 40% 50%, white, transparent),
    radial-gradient(1px 1px at 15% 15%, white, transparent),
    radial-gradient(1px 1px at 85% 25%, white, transparent),
    radial-gradient(1px 1px at 55% 85%, white, transparent),
    radial-gradient(1px 1px at 35% 75%, white, transparent),
    radial-gradient(1px 1px at 75% 55%, white, transparent),
    radial-gradient(1px 1px at 5% 45%, white, transparent),
    radial-gradient(1px 1px at 95% 65%, white, transparent),
    radial-gradient(1px 1px at 45% 35%, white, transparent),
    radial-gradient(1px 1px at 65% 5%, white, transparent),
    radial-gradient(1px 1px at 25% 95%, white, transparent);
  background-size: 200% 200%;
  background-position: 0% 0%;
  animation: starsMove 100s linear infinite;
  opacity: 0.8;
}

.stars-layer-1 {
  background-image: 
    radial-gradient(1px 1px at 25% 25%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 50% 10%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 90% 40%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 70% 70%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 30% 60%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 80% 80%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 10% 90%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 60% 20%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 40% 50%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 15% 15%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 85% 25%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 55% 85%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 35% 75%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 75% 55%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 5% 45%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 95% 65%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 45% 35%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 65% 5%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 25% 95%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 12% 35%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 88% 75%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 42% 12%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 78% 88%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 18% 68%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 92% 18%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 38% 42%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 62% 58%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 8% 82%, rgba(255, 255, 255, 0.8), transparent);
  animation: starsMove 120s linear infinite;
  animation-delay: 0s;
}

.stars-layer-2 {
  background-image: 
    radial-gradient(2px 2px at 30% 20%, rgba(102, 126, 234, 0.8), transparent),
    radial-gradient(2px 2px at 70% 50%, rgba(118, 75, 162, 0.7), transparent),
    radial-gradient(2px 2px at 15% 70%, rgba(59, 130, 246, 0.8), transparent),
    radial-gradient(2px 2px at 85% 30%, rgba(102, 126, 234, 0.7), transparent),
    radial-gradient(2px 2px at 50% 80%, rgba(118, 75, 162, 0.8), transparent),
    radial-gradient(2px 2px at 25% 40%, rgba(59, 130, 246, 0.7), transparent),
    radial-gradient(2px 2px at 75% 60%, rgba(102, 126, 234, 0.8), transparent),
    radial-gradient(2px 2px at 10% 10%, rgba(118, 75, 162, 0.7), transparent),
    radial-gradient(2px 2px at 90% 90%, rgba(59, 130, 246, 0.8), transparent),
    radial-gradient(2px 2px at 40% 15%, rgba(102, 126, 234, 0.7), transparent),
    radial-gradient(2px 2px at 60% 85%, rgba(118, 75, 162, 0.8), transparent),
    radial-gradient(2px 2px at 35% 55%, rgba(59, 130, 246, 0.7), transparent),
    radial-gradient(2px 2px at 65% 25%, rgba(102, 126, 234, 0.8), transparent),
    radial-gradient(2px 2px at 20% 65%, rgba(118, 75, 162, 0.7), transparent),
    radial-gradient(2px 2px at 80% 45%, rgba(59, 130, 246, 0.8), transparent),
    radial-gradient(2px 2px at 45% 95%, rgba(102, 126, 234, 0.7), transparent),
    radial-gradient(2px 2px at 55% 5%, rgba(118, 75, 162, 0.8), transparent),
    radial-gradient(2px 2px at 95% 75%, rgba(59, 130, 246, 0.7), transparent),
    radial-gradient(2px 2px at 5% 25%, rgba(102, 126, 234, 0.8), transparent),
    radial-gradient(2px 2px at 22% 88%, rgba(118, 75, 162, 0.7), transparent);
  animation: starsMove 150s linear infinite reverse;
  animation-delay: -30s;
  opacity: 0.6;
}

.stars-layer-3 {
  background-image: 
    radial-gradient(0.5px 0.5px at 28% 32%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 52% 18%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 18% 28%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 88% 48%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 68% 72%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 32% 58%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 82% 78%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 12% 92%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 58% 22%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 42% 52%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 16% 14%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 86% 24%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 54% 86%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 36% 74%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 74% 54%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 6% 44%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 94% 64%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 44% 34%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 64% 6%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 26% 96%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 48% 38%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 72% 62%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 38% 82%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 62% 18%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 14% 48%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 92% 78%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 34% 12%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 66% 88%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(0.5px 0.5px at 8% 68%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(0.5px 0.5px at 96% 28%, rgba(255, 255, 255, 0.5), transparent);
  animation: starsMove 180s linear infinite;
  animation-delay: -60s;
  opacity: 0.4;
}

@keyframes starsMove {
  0% {
    background-position: 0% 0%;
    opacity: 0.8;
  }
  25% {
    opacity: 1;
  }
  50% {
    background-position: 100% 100%;
    opacity: 0.8;
  }
  75% {
    opacity: 1;
  }
  100% {
    background-position: 0% 0%;
    opacity: 0.8;
  }
}

/* 闪烁的星星 */
.twinkling-star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  box-shadow: 
    0 0 3px rgba(255, 255, 255, 0.9),
    0 0 6px rgba(255, 255, 255, 0.6),
    0 0 10px rgba(102, 126, 234, 0.3);
  opacity: 0;
}

.twinkling-star-1 {
  top: 15%;
  left: 20%;
  animation: twinkle 4s ease-in-out infinite;
  animation-delay: 0s;
}

.twinkling-star-2 {
  top: 35%;
  left: 75%;
  animation: twinkle 5s ease-in-out infinite;
  animation-delay: 1.2s;
}

.twinkling-star-3 {
  top: 60%;
  left: 15%;
  animation: twinkle 4.5s ease-in-out infinite;
  animation-delay: 2.5s;
}

.twinkling-star-4 {
  top: 25%;
  left: 85%;
  animation: twinkle 5.5s ease-in-out infinite;
  animation-delay: 0.8s;
}

.twinkling-star-5 {
  top: 75%;
  left: 65%;
  animation: twinkle 4.8s ease-in-out infinite;
  animation-delay: 3.2s;
}

.twinkling-star-6 {
  top: 50%;
  left: 45%;
  animation: twinkle 5.2s ease-in-out infinite;
  animation-delay: 1.8s;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.1;
    transform: scale(0.8);
    box-shadow: 
      0 0 2px rgba(255, 255, 255, 0.5),
      0 0 4px rgba(255, 255, 255, 0.3);
  }
  15% {
    opacity: 0.4;
    transform: scale(1);
    box-shadow: 
      0 0 4px rgba(255, 255, 255, 0.8),
      0 0 8px rgba(255, 255, 255, 0.5),
      0 0 12px rgba(102, 126, 234, 0.3);
  }
  30% {
    opacity: 0.2;
    transform: scale(0.9);
  }
  45% {
    opacity: 1;
    transform: scale(1.3);
    box-shadow: 
      0 0 6px rgba(255, 255, 255, 1),
      0 0 12px rgba(102, 126, 234, 0.9),
      0 0 20px rgba(118, 75, 162, 0.5),
      0 0 30px rgba(59, 130, 246, 0.3);
  }
  60% {
    opacity: 0.6;
    transform: scale(1.1);
  }
  75% {
    opacity: 0.3;
    transform: scale(0.95);
  }
  90% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}

.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  padding: 48px 40px;
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  min-width: 520px;
  max-width: 600px;
  width: 100%;
  position: relative;
  z-index: 10;
  animation: slideUp 0.5s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  color: #1a1a1a;
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 15px;
  font-weight: 400;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-left: 2px;
}

.input-with-clear {
  position: relative;
  display: flex;
  align-items: center;
}

.market-selector {
  padding: 14px 18px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #333;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
  width: 100%;
}

.market-selector:hover {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.08);
}

.market-selector:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
}

.stock-input {
  padding: 14px 18px;
  padding-right: 50px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #333;
  background: white;
  width: 100%;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.2s ease;
  z-index: 10;
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.clear-btn:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.clear-btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}

.input-with-clear .clear-btn {
  right: 16px;
}

.stock-input::placeholder {
  color: #9ca3af;
}

.stock-input:hover {
  border-color: #d1d5db;
}

.stock-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
}

.download-btn {
  padding: 16px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.download-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message {
  margin-top: 24px;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.message-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .app-container {
    padding: 20px 16px;
  }

  .card {
    min-width: auto;
    padding: 32px 24px;
    border-radius: 16px;
  }

  .title {
    font-size: 26px;
  }

  .subtitle {
    font-size: 14px;
  }

  .form-section {
    gap: 20px;
  }

  .download-btn {
    padding: 14px 24px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .card {
    padding: 28px 20px;
  }

  .title {
    font-size: 24px;
  }
}
</style>

