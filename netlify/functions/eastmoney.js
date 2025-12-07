const fetch = require('node-fetch') // Netlify Functions环境可能需要明确引入node-fetch

exports.handler = async (event, context) => {
  const { url } = event.queryStringParameters || {}

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '缺少url参数' })
    }
  }

  try {
    // 尝试多个API端点
    const endpoints = [
      `https://push2.eastmoney.com/${url}`,
      `https://push2.eastmoney.com/${url}&ut=fa5fd1943c7b386f172d6893dbfba10b&wbp2u=|0|0|0|web`,
    ]
    
    let lastError = null
    for (const targetUrl of endpoints) {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'Referer': 'https://quote.eastmoney.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Origin': 'https://quote.eastmoney.com',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        // 如果返回rc:0且有数据，直接返回
        if (data.rc === 0 && data.data) {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
          }
        }
        
        // 如果返回rc不是0但有data，也返回（可能是其他成功码）
        if (data.data) {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
          }
        }
        
        // 如果返回rc:102，记录错误但继续尝试下一个端点
        if (data.rc === 102) {
          lastError = new Error(`API返回rc:102，数据不存在`)
          continue
        }
        
        // 其他情况，也继续尝试
        lastError = new Error(`API返回异常: rc=${data.rc}`)
        continue
      } catch (err) {
        lastError = err
        continue
      }
    }
    
    // 所有端点都失败
    throw lastError || new Error('所有API端点都失败')
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
