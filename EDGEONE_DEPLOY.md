# EdgeOne Pages 部署指南

## 为什么使用 EdgeOne Pages？

EdgeOne Pages 是腾讯云 EdgeOne 提供的前端开发和部署平台，支持边缘函数（Edge Functions），可以运行服务器端代码作为 API 代理，完美解决 CORS 跨域问题。

## 主要优势

1. ✅ **解决 CORS 问题**：通过边缘函数代理，完全避免 CORS 限制
2. ✅ **稳定可靠**：不依赖第三方 CORS 代理服务
3. ✅ **免费使用**：EdgeOne Pages 提供免费套餐
4. ✅ **自动部署**：连接 GitHub 后，每次 push 自动部署
5. ✅ **全球 CDN**：EdgeOne 提供全球边缘节点加速
6. ✅ **国内访问友好**：腾讯云服务，国内访问速度快

## 项目结构

```
gupiao/
├── edge-functions/           # EdgeOne Pages 边缘函数
│   ├── sina.js              # 新浪财经API代理
│   ├── yahoo.js             # Yahoo Finance API代理
│   └── eastmoney.js         # 东方财富API代理
├── api/                     # Vercel Serverless Functions（保留兼容）
│   ├── sina.js
│   ├── yahoo.js
│   └── eastmoney.js
├── src/                     # 前端代码
├── docs/                    # 构建输出目录
├── edgeone.json             # EdgeOne Pages 配置文件
└── package.json
```

## 部署步骤

### 1. 在 EdgeOne Pages 控制台配置项目

根据你当前的界面，需要配置以下内容：

#### 项目基本信息
- **项目名称**：`Stock`（已填写）
- **加速区域**：`全球可用区 (含中国大陆)`（已选择）
- **生产分支**：`main`（已填写）

#### 构建设置（点击展开）
- **构建命令**：`npm run build`
- **输出目录**：`docs`
- **安装命令**：`npm install`（默认）

#### 环境变量（如果需要）
- 本项目目前不需要环境变量

### 2. 开始部署

点击"开始部署"按钮，EdgeOne Pages 会：
1. 从 GitHub 拉取代码
2. 运行 `npm install` 安装依赖
3. 运行 `npm run build` 构建项目
4. 将 `docs` 目录部署到 CDN
5. 自动识别 `edge-functions` 目录下的边缘函数

### 3. 等待部署完成

部署过程通常需要 2-5 分钟，你可以：
- 查看构建日志
- 等待部署完成
- 获得部署后的 URL

## API 路由说明

项目使用边缘函数作为 API 代理：

- `/api/sina?url=list=xxx` - 新浪财经API代理
- `/api/yahoo?url=xxx` - Yahoo Finance API代理
- `/api/eastmoney?url=xxx` - 东方财富API代理

这些路由在 EdgeOne Pages 上会自动路由到对应的边缘函数（根据 `edgeone.json` 配置）。

## 边缘函数工作原理

EdgeOne Pages 的边缘函数使用 `onRequest` 函数格式：

```javascript
export async function onRequest({ request }) {
  // 1. 解析请求参数
  const url = new URL(request.url)
  const apiUrl = url.searchParams.get('url')
  
  // 2. 代理请求到第三方API
  const response = await fetch(targetUrl, { ... })
  
  // 3. 设置 CORS 头
  return new Response(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      ...
    }
  })
}
```

边缘函数会在 EdgeOne 的全球边缘节点上运行，确保低延迟和高可用性。

## 配置文件说明

### edgeone.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "docs",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "/api/sina",
      "dest": "/edge-functions/sina.js"
    },
    {
      "src": "/api/yahoo",
      "dest": "/edge-functions/yahoo.js"
    },
    {
      "src": "/api/eastmoney",
      "dest": "/edge-functions/eastmoney.js"
    }
  ]
}
```

这个配置文件告诉 EdgeOne Pages：
- 如何构建项目
- 输出目录在哪里
- 如何路由 API 请求到边缘函数

## 部署后验证

部署完成后，你可以：

1. **访问网站**：
   - 使用 EdgeOne Pages 提供的免费域名
   - 测试股票数据下载功能

2. **测试 API 路由**：
   - 直接在浏览器访问：`https://your-project.pages.edgeone.ai/api/sina?url=list=sh600000`
   - 应该能看到返回的股票数据

3. **检查 CORS**：
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 确认 API 请求返回了正确的 CORS 头

## 优势对比

| 特性 | GitHub Pages | Vercel | EdgeOne Pages |
|------|-------------|--------|---------------|
| 静态托管 | ✅ | ✅ | ✅ |
| 边缘函数 | ❌ | ✅ | ✅ |
| 解决 CORS | ❌ | ✅ | ✅ |
| 自动部署 | ✅ | ✅ | ✅ |
| 免费域名 | ✅ | ✅ | ✅ |
| 自定义域名 | ✅ | ✅ | ✅ |
| 全球 CDN | ✅ | ✅ | ✅ |
| 国内访问速度 | ⚠️ | ⚠️ | ✅ 优秀 |

## 注意事项

1. **免费套餐限制**：
   - EdgeOne Pages 免费套餐通常有使用限制
   - 对于个人项目完全够用
   - 具体限制请查看 EdgeOne Pages 官方文档

2. **边缘函数限制**：
   - 边缘函数有执行时间限制（通常 30-60 秒）
   - 有内存限制
   - 对于 API 代理场景完全够用

3. **编码问题**：
   - 新浪API可能返回GBK编码
   - 边缘函数环境可能不支持某些编码库
   - 如果遇到编码问题，可能需要调整边缘函数代码

## 故障排除

### 问题1：API 调用失败

**检查步骤**：
1. 查看 EdgeOne Pages 控制台的边缘函数日志
2. 检查 `edgeone.json` 配置是否正确
3. 确认边缘函数文件在 `edge-functions` 目录下
4. 检查边缘函数是否导出了 `onRequest` 函数

### 问题2：CORS 错误

**解决方案**：
1. 确认边缘函数返回了正确的 CORS 头
2. 检查响应头中是否包含 `Access-Control-Allow-Origin: *`

### 问题3：构建失败

**检查步骤**：
1. 查看构建日志
2. 确认 `package.json` 中的构建脚本正确
3. 确认输出目录 `docs` 存在

### 问题4：编码问题（中文乱码）

**解决方案**：
1. 新浪API可能返回GBK编码
2. 如果遇到乱码，可能需要：
   - 在边缘函数中处理编码转换
   - 或者让前端处理编码问题

## 更新代码

每次更新代码后：

1. **推送到 GitHub**：
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```

2. **EdgeOne Pages 自动部署**：
   - 如果已连接 GitHub，EdgeOne Pages 会自动检测并部署
   - 在 EdgeOne Pages 控制台可以看到部署状态
   - 部署完成后会自动更新网站

## 与 Vercel 的区别

1. **边缘函数格式**：
   - Vercel 使用 `export default async function handler(req, res)`
   - EdgeOne Pages 使用 `export async function onRequest({ request })`

2. **响应格式**：
   - Vercel 使用 `res.status(200).json(data)`
   - EdgeOne Pages 使用 `new Response(data, { status: 200, headers: {...} })`

3. **配置文件**：
   - Vercel 使用 `vercel.json`
   - EdgeOne Pages 使用 `edgeone.json`

4. **函数目录**：
   - Vercel 使用 `api/` 目录
   - EdgeOne Pages 使用 `edge-functions/` 目录

## 更多资源

- [EdgeOne Pages 官方文档](https://pages.edgeone.ai)
- [EdgeOne Pages 边缘函数文档](https://pages.edgeone.ai/zh/document/edge-functions)
- [腾讯云 EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)

