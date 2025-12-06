# GitHub 部署指南

## 第一步：推送代码到 GitHub

由于需要 GitHub 认证，请按以下步骤操作：

### 方法1：使用 Personal Access Token（推荐）

1. **创建 Personal Access Token**：
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token" → "Generate new token (classic)"
   - Token 名称：输入 "Stock Project" 或任意名称
   - 过期时间：选择你需要的期限（建议 90 天或 No expiration）
   - 权限：勾选 `repo`（完整仓库权限）
   - 点击 "Generate token"
   - **重要**：复制生成的 token（只显示一次，请保存好）

2. **推送代码**：
   在终端运行以下命令：
   ```bash
   git push -u origin main
   ```
   
   当提示输入用户名时，输入你的 GitHub 用户名
   当提示输入密码时，**粘贴刚才复制的 token**（不是你的 GitHub 密码）

### 方法2：使用 SSH（如果已配置）

如果你已经将 SSH 公钥添加到 GitHub，可以：
```bash
git remote set-url origin git@github.com:TTGary/Stock.git
git push -u origin main
```

## 第二步：配置 GitHub Pages 部署

代码推送成功后，需要配置 GitHub Pages：

1. **访问仓库设置**：
   - 打开 https://github.com/TTGary/Stock
   - 点击右上角的 "Settings"（设置）

2. **配置 Pages**：
   - 在左侧菜单找到 "Pages"
   - 在 "Source" 部分：
     - Branch: 选择 `main`
     - Folder: 选择 `/docs`
   - 点击 "Save"

3. **等待部署**：
   - GitHub 会自动构建和部署
   - 通常需要 1-2 分钟
   - 部署完成后，你会看到类似这样的地址：
     `https://ttgary.github.io/Stock/`

## 第三步：更新代码后重新部署

每次更新代码后：

1. **构建生产版本**：
   ```bash
   npm run build
   ```

2. **提交并推送**：
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```

3. **GitHub Pages 会自动更新**（可能需要几分钟）

## 注意事项

- 确保 `vite.config.js` 中的 `base` 路径是 `/Stock/`（已配置）
- 构建输出目录是 `docs`（已配置）
- 如果网站无法访问，检查 GitHub Pages 设置中的分支和文件夹是否正确

