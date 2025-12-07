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
    
    // 获取响应数据，新浪API返回GBK编码
    // EdgeOne Pages 边缘函数环境不支持 GBK 解码
    // 返回原始二进制数据，让前端使用 TextDecoder 处理编码
    const arrayBuffer = await response.arrayBuffer()
    
    // 直接返回 ArrayBuffer，前端会使用 TextDecoder 处理
    // 前端可以使用 'gbk' 或 'gb2312' 编码来解码
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=gbk',
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

