exports.handler = async (event, context) => {
  const { url } = event.queryStringParameters || {}
  
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '缺少url参数' })
    }
  }

  try {
    const targetUrl = `https://hq.sinajs.cn/${url}`
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.text()
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: data
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

