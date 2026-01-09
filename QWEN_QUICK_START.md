# 🚀 通义千问 API - 5分钟快速配置

## ✅ 配置清单

### 步骤 1：获取 API Key（2分钟）

- [ ] 访问 https://dashscope.aliyun.com/
- [ ] 注册/登录阿里云账号
- [ ] 开通灵积服务
- [ ] 创建 API Key
- [ ] 复制 API Key（格式：`sk-xxxxxxxxxx`）

---

### 步骤 2：配置云函数（1分钟）

打开文件：`cloudfunctions/aiChat/index.js`

找到第 12 行：
```javascript
const QWEN_API_KEY = 'YOUR_API_KEY_HERE'  // ⚠️ 替换这里
```

修改为：
```javascript
const QWEN_API_KEY = 'sk-你的真实APIKey'  // 粘贴您的 API Key
```

保存文件。

---

### 步骤 3：安装依赖（1分钟）

**方法 1：开发者工具（推荐）**
```
右键 cloudfunctions/aiChat 文件夹
→ 在终端中打开
→ 执行：npm install
```

**方法 2：命令行**
```bash
cd cloudfunctions/aiChat
npm install
```

---

### 步骤 4：部署云函数（1分钟）

```
右键 cloudfunctions/aiChat 文件夹
→ 上传并部署：云端安装依赖
→ 等待部署完成（约30秒）
```

---

### 步骤 5：测试（30秒）

1. 重新编译小程序
2. 进入「AI助手」页面
3. 发送消息："你好"
4. 查看是否收到 AI 回复

---

## ✨ 完成！

如果收到智能回复，说明配置成功！

---

## 🐛 遇到问题？

### 问题 1：提示 "axios is not defined"
**解决：** 重新执行 `npm install`，然后重新部署

### 问题 2：回复仍然是本地关键词
**解决：** 检查 API Key 是否正确复制，确保没有多余的空格

### 问题 3：API 调用失败
**解决：** 
1. 查看云函数日志（云开发控制台 → 云函数 → aiChat → 日志）
2. 确认灵积服务已开通
3. 检查是否有免费额度

---

## 📚 详细文档

- **完整配置指南：** `QWEN_API_SETUP.md`
- **对话示例：** `QWEN_API_EXAMPLE.md`

---

## 💰 费用说明

- **免费额度：** 新用户有 1000万 tokens 免费额度
- **付费价格：** qwen-turbo 约 0.002元/1K tokens
- **成本估算：** 1000次对话 ≈ 10-20元

---

## 🎯 下一步

- [ ] 优化系统提示词（在 `index.js` 中修改）
- [ ] 测试各种对话场景
- [ ] 监控 API 使用情况
- [ ] 收集用户反馈

---

**开始使用您的智能反诈骗助手吧！** 🤖

