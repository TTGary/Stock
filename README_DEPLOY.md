# 部署方案对比

## 问题

GitHub Pages 是静态托管，无法运行服务器端代码，导致：
- ❌ 无法使用 Vite 的代理功能
- ❌ 所有 CORS 代理服务都不稳定（超时、403、500错误）
- ❌ 无法正常使用下载功能

## 解决方案：使用 Vercel

Vercel 支持 Serverless Functions，可以运行后端代理代码，完美解决 CORS 问题。

### 优势

1. ✅ **解决 CORS 问题**：通过服务器端代理，完全避免 CORS 限制
2. ✅ **稳定可靠**：不依赖第三方 CORS 代理服务
3. ✅ **免费使用**：Vercel 免费套餐足够个人项目使用
4. ✅ **自动部署**：连接 GitHub 后，每次 push 自动部署
5. ✅ **全球 CDN**：Vercel 提供全球 CDN 加速

### 快速部署

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New..." → "Project"
4. 选择仓库 `TTGary/Stock`
5. 配置：
   - Build Command: `npm run build`
   - Output Directory: `docs`
6. 点击 "Deploy"

详细步骤请查看 `VERCEL_DEPLOY.md`

## 项目结构

```
gupiao/
├── api/                    # Serverless Functions（Vercel使用）
│   ├── sina.js            # 新浪财经API代理
│   ├── yahoo.js          # Yahoo Finance API代理
│   └── eastmoney.js      # 东方财富API代理
├── src/                    # 前端代码
├── docs/                   # 构建输出目录
├── vercel.json            # Vercel 配置文件
└── package.json
```

## API 路由

项目使用 Serverless Functions 作为 API 代理：

- `/api/sina?url=list=xxx` - 新浪财经API代理
- `/api/yahoo?url=xxx` - Yahoo Finance API代理
- `/api/eastmoney?url=xxx` - 东方财富API代理

这些路由在 Vercel 上会自动路由到对应的 Serverless Functions，在开发环境中由 Vite 代理处理。

## 开发环境

开发环境仍然使用 Vite 代理，无需修改：

```bash
npm run dev
```

Vite 配置已更新，支持新的 API 路由格式。

## 注意事项

1. **GitHub Pages 仍然可用**：代码已推送到 GitHub，GitHub Pages 仍然可以访问，但下载功能无法使用
2. **Vercel 部署后**：下载功能将完全正常工作
3. **免费套餐限制**：Vercel 免费套餐对个人项目完全够用

