# GitHub 推送网络问题解决方案

## 问题
无法连接到 GitHub（端口 443 连接失败）

## 解决方案

### 方案1：配置 Git 代理（如果你有代理）

如果你使用代理（如 Clash、V2Ray 等），配置 Git 使用代理：

```bash
# HTTP 代理（根据你的代理端口修改）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 或者 SOCKS5 代理
git config --global http.proxy socks5://127.0.0.1:1080
git config --global https.proxy socks5://127.0.0.1:1080
```

然后重新推送：
```bash
git push -u origin main
```

### 方案2：使用 GitHub Desktop（图形界面，推荐）

1. 下载安装 GitHub Desktop：https://desktop.github.com/
2. 登录你的 GitHub 账号
3. 添加本地仓库：File → Add Local Repository → 选择 `D:\yunzhi\gupiao`
4. 点击 "Publish repository" 或 "Push origin"

### 方案3：稍后重试

网络问题可能是暂时的，可以：
- 等待几分钟后重试
- 换个网络环境（如使用手机热点）
- 在非高峰时段重试

### 方案4：使用 SSH（如果已配置 SSH 密钥）

```bash
git remote set-url origin git@github.com:TTGary/Stock.git
git push -u origin main
```

### 方案5：手动上传（临时方案）

如果以上方法都不行，可以：
1. 在 GitHub 网页上手动创建文件
2. 或者使用 GitHub 网页上传功能

## 检查当前配置

你的 token 已经配置在远程 URL 中，一旦网络连接成功就可以推送。

## 取消代理配置（如果需要）

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

