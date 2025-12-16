# 股票数据下载工具

快速获取 A股/美股/港股 实时数据并导出 Excel。

## 功能特点

- 支持 A股、美股、港股 三大市场
- 实时数据自动刷新（5秒间隔）
- 一键导出 Excel 表格
- 数据本地持久化存储

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打包构建
npm run build
```

## 部署到 GitHub Pages

1. 在 GitHub 创建仓库

2. 初始化并推送代码：
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

3. 部署：
```bash
npm run deploy
```

4. 在 GitHub 仓库 Settings → Pages 中，选择 `gh-pages` 分支

5. 访问：`https://你的用户名.github.io/stock/`

## 技术栈

- Vue 3
- Vite
- Axios
- ExcelJS
