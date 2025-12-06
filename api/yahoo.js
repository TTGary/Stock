export default async function handler(req, res) {
  const { url } = req.query
  
  if (!url) {
    return res.status(400).json({ error: '缺少url参数' })
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
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

