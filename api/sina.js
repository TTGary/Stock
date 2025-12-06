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
    
    const data = await response.text()
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

