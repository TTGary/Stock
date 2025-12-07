// EdgeOne Pages 边缘函数 - 新浪财经API代理
export async function onRequest({ request }) {
  try {
    const url = new URL(request.url)
    const apiUrl = url.searchParams.get('url')
    
    if (!apiUrl) {
      return new Response(JSON.stringify({ error: '缺少url参数' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    const targetUrl = `https://hq.sinajs.cn/${apiUrl}`
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // 获取响应数据，新浪API可能返回GBK编码
    // 注意：EdgeOne Pages 边缘函数环境可能不支持 GBK 解码
    // 这里先尝试 UTF-8，如果遇到乱码，可能需要在前端处理
    const arrayBuffer = await response.arrayBuffer()
    
    // 尝试使用 UTF-8 解码
    let text
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false })
      text = decoder.decode(arrayBuffer)
      
      // 如果解码结果看起来不正常（包含乱码字符），尝试其他方法
      // 注意：EdgeOne Pages 可能不支持 GBK，如果遇到乱码，需要在前端处理
      if (text.includes('') || text.includes('\ufffd')) {
        // 如果包含替换字符，说明编码可能不对
        // 但边缘函数环境可能无法处理GBK，所以先返回，让前端处理
        console.warn('可能遇到编码问题，建议在前端处理')
      }
    } catch (e) {
      // 如果解码失败，尝试使用默认编码
      text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer)
    }
    
    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

