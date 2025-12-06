export default async function handler(req, res) {
  const { url } = req.query
  
  if (!url) {
    return res.status(400).json({ error: '缺少url参数' })
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
    
    // 获取响应数据，新浪API可能返回GBK编码
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 尝试检测编码并转换
    let text
    try {
      // 导入iconv-lite（ES模块方式）
      const iconv = await import('iconv-lite')
      // 先尝试GBK解码（新浪API通常使用GBK）
      try {
        text = iconv.decode(buffer, 'gbk')
        // 验证解码结果是否合理（包含中文字符）
        if (!/[\u4e00-\u9fa5]/.test(text)) {
          // 如果不包含中文，可能是UTF-8
          text = buffer.toString('utf8')
        }
      } catch (e) {
        // 如果GBK解码失败，使用UTF-8
        text = buffer.toString('utf8')
      }
    } catch (e) {
      // 如果iconv-lite不可用，直接使用UTF-8
      text = buffer.toString('utf8')
    }
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(text)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

