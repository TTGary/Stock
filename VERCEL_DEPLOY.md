# Vercel 部署指南

## 为什么使用 Vercel？

GitHub Pages 是静态托管，无法运行服务器端代码，所以无法使用代理功能。Vercel 支持 Serverless Functions，可以运行后端代理代码，完美解决 CORS 问题。

## 部署步骤

### 方法1：通过 Vercel 网站部署（推荐）

1. **访问 Vercel**：
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**：
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `TTGary/Stock`
   - Vercel 会自动检测项目配置

3. **配置项目**：
   - Framework Preset: 选择 "Other" 或 "Vite"
   - Build Command: `npm run build`
   - Output Directory: `docs`
   - Install Command: `npm install`

4. **部署**：
   - 点击 "Deploy"
   - 等待部署完成（通常 1-2 分钟）

5. **访问网站**：
   - 部署完成后，Vercel 会提供一个 URL，例如：`https://stock-xxx.vercel.app`
   - 你可以自定义域名或使用 Vercel 提供的免费域名

### 方法2：通过 Vercel CLI 部署

1. **安装 Vercel CLI**：
   ```bash
   npm i -g vercel
   ```

2. **登录**：
   ```bash
   vercel login
   ```

3. **部署**：
   ```bash
   vercel
   ```

4. **生产环境部署**：
   ```bash
   vercel --prod
   ```

## 项目结构

```
gupiao/
├── api/                    # Serverless Functions
│   ├── sina.js            # 新浪财经API代理
│   ├── yahoo.js          # Yahoo Finance API代理
│   └── eastmoney.js      # 东方财富API代理
├── src/                    # 前端代码
├── docs/                   # 构建输出目录
├── vercel.json            # Vercel 配置文件
└── package.json
```

## API 路由说明

项目使用 Serverless Functions 作为 API 代理：

- `/api/sina?url=list=xxx` - 新浪财经API代理
- `/api/yahoo?url=xxx` - Yahoo Finance API代理
- `/api/eastmoney?url=xxx` - 东方财富API代理

这些路由在 Vercel 上会自动路由到对应的 Serverless Functions。

## 优势

1. ✅ **解决 CORS 问题**：通过服务器端代理，完全避免 CORS 限制
2. ✅ **稳定可靠**：不依赖第三方 CORS 代理服务
3. ✅ **免费使用**：Vercel 免费套餐足够个人项目使用
4. ✅ **自动部署**：连接 GitHub 后，每次 push 自动部署
5. ✅ **全球 CDN**：Vercel 提供全球 CDN 加速

## 注意事项

1. **免费套餐限制**：
   - 每月 100GB 带宽
   - 100 次 Serverless Function 调用/秒
   - 对于个人项目完全够用

2. **环境变量**（如果需要）：
   - 在 Vercel 项目设置中可以添加环境变量
   - 本项目目前不需要环境变量

3. **自定义域名**：
   - Vercel 支持免费自定义域名
   - 在项目设置中添加你的域名即可

## 与 GitHub Pages 的区别

| 特性 | GitHub Pages | Vercel |
|------|-------------|--------|
| 静态托管 | ✅ | ✅ |
| Serverless Functions | ❌ | ✅ |
| 解决 CORS | ❌ | ✅ |
| 自动部署 | ✅ | ✅ |
| 免费域名 | ✅ | ✅ |
| 自定义域名 | ✅ | ✅ |
| 全球 CDN | ✅ | ✅ |

## 故障排除

如果部署后 API 调用失败：

1. 检查 Vercel 函数日志：
   - 在 Vercel 控制台查看 Functions 日志
   - 查看是否有错误信息

2. 检查 API 路由：
   - 确保 `api/` 目录下的文件格式正确
   - 确保导出了 `handler` 函数

3. 检查网络请求：
   - 在浏览器开发者工具中查看 Network 标签
   - 检查 API 请求是否返回正确

## 更新代码

每次更新代码后：

1. **推送到 GitHub**：
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```

2. **Vercel 自动部署**：
   - 如果已连接 GitHub，Vercel 会自动检测并部署
   - 在 Vercel 控制台可以看到部署状态

