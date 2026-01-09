# 登录失败排查指南

## 🔍 问题：点击登录显示"登录失败"

### 第一步：查看云函数日志（最关键）

1. **打开云开发控制台**
   - 微信开发者工具 → 顶部工具栏 → 「云开发」按钮
   - 或直接访问：https://console.cloud.tencent.com/tcb

2. **查看云函数日志**
   - 左侧菜单：云函数 → 函数列表
   - 点击 `login` 云函数
   - 点击「日志」标签
   - 查看最新的错误日志

3. **常见错误信息**

#### ❌ 错误 1: "collection 'users' not found"
**原因：** 数据库集合 `users` 未创建

**解决方法：**
1. 云开发控制台 → 数据库
2. 点击「+」创建集合
3. 集合名称输入：`users`
4. 点击确定
5. 重新尝试登录

#### ❌ 错误 2: "Permission denied"
**原因：** 数据库权限配置问题

**解决方法：**
1. 云开发控制台 → 数据库
2. 选择 `users` 集合
3. 点击「权限设置」
4. 选择「自定义安全规则」
5. 输入以下规则：
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```
6. 保存后重试

#### ❌ 错误 3: "Cloud function not found"
**原因：** 云函数未正确部署

**解决方法：**
1. 在微信开发者工具中找到 `cloudfunctions/login`
2. 右键点击 → 「上传并部署：云端安装依赖」
3. 等待部署完成
4. 刷新页面重试

#### ❌ 错误 4: "env not specified"
**原因：** 云环境 ID 未配置

**解决方法：**
检查 `app.js` 第 8 行，确认环境 ID 已填写：
```javascript
env: 'cloud1-9g3v8lt8fb0108e7', // ✅ 已配置
```

---

### 第二步：检查数据库集合

确保以下集合已创建：

| 集合名称 | 状态 | 创建方法 |
|---------|------|---------|
| `users` | ⚠️ 必须 | 云开发控制台 → 数据库 → 创建集合 |
| `articles` | 可选 | 同上 |
| `chat_logs` | 可选 | 同上 |
| `sign_records` | 可选 | 同上 |

**最少需要创建 `users` 集合才能登录！**

---

### 第三步：检查云函数部署状态

1. 云开发控制台 → 云函数 → 函数列表
2. 确认 `login` 云函数存在且状态为「正常」
3. 查看「修改时间」确认是最新部署

---

### 第四步：测试云函数

在云开发控制台测试云函数：

1. 云函数列表 → 点击 `login`
2. 点击「测试」按钮
3. 输入测试参数：
```json
{
  "nickName": "测试用户",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```
4. 点击「运行测试」
5. 查看返回结果：

**✅ 成功响应：**
```json
{
  "success": true,
  "data": {
    "openid": "oXXXX...",
    "userInfo": {
      "_id": "...",
      "nickName": "测试用户",
      ...
    }
  }
}
```

**❌ 失败响应：**
```json
{
  "success": false,
  "errMsg": "collection 'users' not found"
}
```

---

### 第五步：前端调试

在 `pages/user/user.js` 的 `handleLogin` 方法中添加调试信息：

```javascript
try {
  const result = await wx.cloud.callFunction({
    name: 'login',
    data: {
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl
    }
  })
  
  // 添加调试日志
  console.log('云函数返回结果：', result)
  console.log('result.result：', result.result)
  
  if (result.result.success) {
    // ... 成功逻辑
  } else {
    // 显示具体错误信息
    console.error('登录失败：', result.result.errMsg)
    wx.showModal({
      title: '登录失败',
      content: result.result.errMsg || '未知错误',
      showCancel: false
    })
  }
} catch (err) {
  console.error('调用云函数失败：', err)
  wx.showModal({
    title: '登录失败',
    content: err.message || '网络错误',
    showCancel: false
  })
}
```

---

## ✅ 快速解决方案（最可能）

**99% 的情况是数据库集合未创建！**

### 立即执行：

1. ✅ 打开云开发控制台
2. ✅ 进入「数据库」
3. ✅ 点击「+」创建集合
4. ✅ 输入集合名称：`users`
5. ✅ 点击确定
6. ✅ 重新点击登录

**创建集合后立即重试，99% 会成功！**

---

## 🆘 如果还是失败

1. **查看控制台日志**
   - 微信开发者工具 → 控制台 → 查看错误信息
   
2. **查看云函数日志**
   - 云开发控制台 → 云函数 → login → 日志
   
3. **提供错误信息**
   - 截图控制台错误
   - 截图云函数日志
   - 说明具体报错内容

---

## 📝 检查清单

- [ ] 云开发环境已开通
- [ ] 环境 ID 已填入 app.js
- [ ] `users` 集合已创建 ⭐ **最重要**
- [ ] `login` 云函数已部署
- [ ] 云函数状态为「正常」
- [ ] 数据库权限已配置

---

## 🎯 100% 解决方案

如果上述方法都不行，执行以下步骤：

### 1. 重新部署云函数

```bash
# 在微信开发者工具中
右键 cloudfunctions/login → 删除云端函数
右键 cloudfunctions/login → 上传并部署：云端安装依赖
```

### 2. 重新创建数据库集合

```bash
云开发控制台 → 数据库 → users 集合
如已存在，删除并重新创建
```

### 3. 清除缓存重试

```bash
微信开发者工具 → 工具 → 清除缓存
重新编译项目
```

---

**90% 的问题都是数据库集合未创建导致的！**

请先创建 `users` 集合，然后告诉我结果！

