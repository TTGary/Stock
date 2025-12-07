// EdgeOne Pages 边缘函数 - mairuiapi.com API代理
// 用于获取行业信息和市场数据（换手率、量比等）
export async function onRequest({ request }) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') // industry 或 market
    const code = url.searchParams.get('code') // 股票代码
    
    if (!type || !code) {
      return new Response(JSON.stringify({ error: '缺少参数：需要type和code' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    let targetUrl
    if (type === 'industry') {
      // 行业信息API
      targetUrl = `https://api.mairuiapi.com/hszg/zg/${code}/92828F2B-B0C0-4DC1-8E13-762688E6F408`
    } else if (type === 'market') {
      // 市场数据API
      targetUrl = `https://api.mairuiapi.com/hsrl/ssjy/${code}/92828F2B-B0C0-4DC1-8E13-762688E6F408`
    } else {
      return new Response(JSON.stringify({ error: '无效的类型参数，type必须是industry或market' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
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

