# 如何更新过期的 GitHub Token

如果 Personal Access Token 过期了，按以下步骤更新：

## 方法1：通过 Windows 凭据管理器（推荐）

1. **打开凭据管理器**：
   - 按 `Win + R`，输入 `control /name Microsoft.CredentialManager`
   - 或者：控制面板 → 凭据管理器 → Windows 凭据

2. **找到 GitHub 凭据**：
   - 在 "普通凭据" 中找到 `git:https://github.com`
   - 点击展开，然后点击 "编辑"

3. **更新密码**：
   - 将密码字段替换为新的 token
   - 点击 "保存"

4. **重新推送**：
   ```bash
   git push
   ```

## 方法2：通过命令行清除并重新输入

```bash
# 清除保存的凭据
git credential-manager-core erase
host=github.com
protocol=https

# 然后重新推送，会提示输入新的 token
git push
```

## 方法3：在 URL 中直接使用 token

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/TTGary/Stock.git
```

（注意：这种方式 token 会保存在配置中，安全性较低）

## 检查 token 是否过期

如果推送时出现以下错误，说明 token 过期了：
- `remote: Invalid username or password`
- `fatal: Authentication failed`

## 安全建议

1. **定期更新**：建议每 90 天更新一次 token
2. **不要分享**：token 就像密码，不要分享给他人
3. **及时撤销**：如果 token 泄露，立即在 GitHub 设置中撤销它
4. **最小权限**：只授予必要的权限（repo 即可）

