exports.handler = async (event, context) => {
  const { url } = event.queryStringParameters || {}
  
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '缺少url参数' })
    }
  }

  try {
    const targetUrl = `https://query1.finance.yahoo.com/${url}`
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

