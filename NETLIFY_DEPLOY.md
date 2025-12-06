# Netlify 部署指南

## 为什么使用 Netlify？

如果 Vercel 无法访问，Netlify 是另一个很好的选择，也支持 Serverless Functions，可以完美解决 CORS 问题。

## 部署步骤

### 方法1：通过 Netlify 网站部署（推荐）

1. **访问 Netlify**：
   - 打开 https://www.netlify.com
   - 使用 GitHub 账号登录

2. **导入项目**：
   - 点击 "Add new site" → "Import an existing project"
   - 选择 "Deploy with GitHub"
   - 授权 Netlify 访问你的 GitHub 账号
   - 选择仓库 `TTGary/Stock`

3. **配置项目**：
   - Build command: `npm run build`
   - Publish directory: `docs`
   - 其他设置使用默认值

4. **部署**：
   - 点击 "Deploy site"
   - 等待部署完成（通常 1-2 分钟）

5. **访问网站**：
   - 部署完成后，Netlify 会提供一个 URL，例如：`https://stock-xxx.netlify.app`
   - 你可以自定义域名或使用 Netlify 提供的免费域名

### 方法2：通过 Netlify CLI 部署

1. **安装 Netlify CLI**：
   ```bash
   npm install -g netlify-cli
   ```

2. **登录**：
   ```bash
   netlify login
   ```

3. **初始化项目**：
   ```bash
   netlify init
   ```
   - 选择 "Create & configure a new site"
   - 输入站点名称（或使用默认值）
   - 构建命令：`npm run build`
   - 发布目录：`docs`

4. **部署**：
   ```bash
   netlify deploy --prod
   ```

## 项目结构

```
gupiao/
├── netlify/
│   └── functions/          # Netlify Functions
│       ├── sina.js        # 新浪财经API代理
│       ├── yahoo.js      # Yahoo Finance API代理
│       └── eastmoney.js  # 东方财富API代理
├── src/                    # 前端代码
├── docs/                   # 构建输出目录
├── netlify.toml           # Netlify 配置文件
└── package.json
```

## API 路由

Netlify Functions 会自动处理 `/api/*` 路由：

- `/api/sina?url=list=xxx` - 新浪财经API代理
- `/api/yahoo?url=xxx` - Yahoo Finance API代理
- `/api/eastmoney?url=xxx` - 东方财富API代理

这些路由会自动路由到对应的 Netlify Functions。

## 优势

1. ✅ **解决 CORS 问题**：通过服务器端代理，完全避免 CORS 限制
2. ✅ **稳定可靠**：不依赖第三方 CORS 代理服务
3. ✅ **免费使用**：Netlify 免费套餐足够个人项目使用
4. ✅ **自动部署**：连接 GitHub 后，每次 push 自动部署
5. ✅ **全球 CDN**：Netlify 提供全球 CDN 加速

## 注意事项

1. **免费套餐限制**：
   - 每月 100GB 带宽
   - 125,000 次 Function 调用/月
   - 对于个人项目完全够用

2. **环境变量**（如果需要）：
   - 在 Netlify 项目设置中可以添加环境变量
   - 本项目目前不需要环境变量

3. **自定义域名**：
   - Netlify 支持免费自定义域名
   - 在项目设置中添加你的域名即可

## 与 Vercel 的区别

| 特性 | Vercel | Netlify |
|------|--------|---------|
| Serverless Functions | ✅ | ✅ |
| 解决 CORS | ✅ | ✅ |
| 自动部署 | ✅ | ✅ |
| 免费域名 | ✅ | ✅ |
| 自定义域名 | ✅ | ✅ |
| 全球 CDN | ✅ | ✅ |

两者功能基本相同，选择可以访问的平台即可。

## 故障排除

如果部署后 API 调用失败：

1. 检查 Netlify Functions 日志：
   - 在 Netlify 控制台查看 Functions 日志
   - 查看是否有错误信息

2. 检查 API 路由：
   - 确保 `netlify/functions/` 目录下的文件格式正确
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

2. **Netlify 自动部署**：
   - 如果已连接 GitHub，Netlify 会自动检测并部署
   - 在 Netlify 控制台可以看到部署状态

