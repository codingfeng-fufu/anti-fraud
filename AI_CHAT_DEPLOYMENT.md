# AI 聊天机器人部署指南

## ✅ 已完成的工作

### 1. 云函数改造 ✓

**文件：** `cloudfunctions/aiChat/index.js`

**主要改动：**
- ✅ 集成 axios 库用于 HTTP 请求
- ✅ 添加通义千问 API 调用逻辑
- ✅ 实现智能降级机制（API 失败时使用本地回复）
- ✅ 支持对话历史管理（最近3轮对话）
- ✅ 优化系统提示词（反诈骗专业领域）
- ✅ 添加详细的日志记录

---

### 2. 依赖配置 ✓

**文件：** `cloudfunctions/aiChat/package.json`

**依赖包：**
```json
{
  "wx-server-sdk": "~2.6.3",
  "axios": "^0.27.2"
}
```

---

### 3. 前端保持不变 ✓

**文件：** 
- `pages/chat/chat.js`
- `pages/chat/chat.wxml`
- `pages/chat/chat.wxss`

**说明：** 前端无需修改，继续调用 `aiChat` 云函数即可。

---

## 📝 配置步骤

### 第 1 步：获取通义千问 API Key

#### 1.1 访问阿里云灵积
```
https://dashscope.aliyun.com/
```

#### 1.2 注册/登录
- 使用阿里云账号登录
- 新用户需要注册

#### 1.3 开通服务
- 点击「开通服务」
- 同意服务协议

#### 1.4 创建 API Key
- 进入控制台：https://dashscope.console.aliyun.com/apiKey
- 点击「创建新的 API Key」
- 复制生成的 API Key

**API Key 格式：** `sk-xxxxxxxxxxxxxxxxxxxxxxxx`

---

### 第 2 步：配置云函数

#### 2.1 打开配置文件
```
cloudfunctions/aiChat/index.js
```

#### 2.2 找到配置区域（第 13-23 行）
```javascript
// ==================== 配置区域 ====================
// 🔑 在这里填写您的通义千问 API Key
const QWEN_API_KEY = 'YOUR_API_KEY_HERE'  // ⚠️ 请替换为您的真实 API Key

// 通义千问 API 配置
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
const QWEN_MODEL = 'qwen-turbo'  // 或使用 'qwen-plus', 'qwen-max'

// 是否启用 AI 服务（如果未配置 API Key，将使用本地关键词回复）
const AI_ENABLED = QWEN_API_KEY !== 'YOUR_API_KEY_HERE' && QWEN_API_KEY !== ''
// ==================================================
```

#### 2.3 填写 API Key
```javascript
const QWEN_API_KEY = 'sk-你的真实APIKey'  // 粘贴您在第1步复制的 API Key
```

#### 2.4 选择模型（可选）

| 模型 | 特点 | 适合场景 |
|------|------|---------|
| `qwen-turbo` | 快速、便宜 | **推荐**，日常对话 |
| `qwen-plus` | 平衡 | 复杂问题 |
| `qwen-max` | 质量最高 | 专业分析 |

**默认使用 `qwen-turbo` 即可。**

---

### 第 3 步：安装依赖

#### 方法 1：使用微信开发者工具（推荐）

```
1. 右键点击 cloudfunctions/aiChat 文件夹
2. 选择「在终端中打开」
3. 执行命令：npm install
4. 等待安装完成
```

#### 方法 2：使用命令行

```bash
cd cloudfunctions/aiChat
npm install
```

**预期输出：**
```
added 52 packages in 3s
```

---

### 第 4 步：部署云函数

#### 4.1 上传部署

```
1. 右键点击 cloudfunctions/aiChat 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成（约30秒-1分钟）
```

#### 4.2 确认部署成功

**在控制台查看：**
```
云开发控制台
→ 云函数
→ aiChat
→ 版本管理
→ 查看最新版本
```

**日志检查：**
```
云开发控制台
→ 云函数
→ aiChat
→ 日志
→ 查看是否有错误信息
```

---

### 第 5 步：测试

#### 5.1 重新编译小程序
```
点击微信开发者工具的「编译」按钮
```

#### 5.2 进入 AI 助手页面
```
点击底部导航的「AI助手」
```

#### 5.3 发送测试消息

**测试消息 1：** `你好`

**预期回复（AI 智能）：**
```
你好！很高兴为您服务😊

我是反诈AI助手，可以帮助您：
• 识别各类诈骗手段
• 解答防骗相关问题
• 分析可疑信息
• 提供安全建议

💡 您可以：
1. 描述遇到的可疑情况
2. 询问某种诈骗类型
3. 上传可疑信息截图

请告诉我您遇到的具体情况吧！
```

**测试消息 2：** `什么是刷单骗局？`

**测试消息 3：** `有人让我做兼职，日赚500，可信吗？`

#### 5.4 验证 AI 是否启用

**如果配置成功：**
- 回复内容丰富、个性化
- 可以理解上下文
- 回复速度：2-5秒

**如果未配置（本地关键词）：**
- 回复内容固定
- 无上下文理解
- 回复速度：瞬间
- 会显示提示：`⚠️ 提示：当前使用本地关键词回复`

---

## 🔍 调试方法

### 查看云函数日志

```
云开发控制台
→ 云函数
→ aiChat
→ 日志
```

**正常日志：**
```
调用通义千问 API... { messageCount: 2 }
通义千问回复成功
```

**错误日志：**
```
通义千问 API 调用失败： Request failed with status code 401
API 错误响应： { code: 'InvalidApiKey', message: 'Invalid API key' }
```

---

### 常见错误及解决

#### 错误 1：`axios is not defined`

**原因：** 依赖未安装

**解决：**
```bash
cd cloudfunctions/aiChat
npm install
```
然后重新部署云函数。

---

#### 错误 2：`Request failed with status code 401`

**原因：** API Key 错误或未配置

**解决：**
1. 检查 `QWEN_API_KEY` 是否正确
2. 确认 API Key 格式：`sk-xxxxxx`
3. 确认没有多余的空格或引号

---

#### 错误 3：`Request failed with status code 429`

**原因：** 请求频率过高

**解决：**
1. 等待几秒后再试
2. 检查是否有死循环调用
3. 查看 API 使用情况：https://dashscope.console.aliyun.com/usage

---

#### 错误 4：回复一直是本地关键词

**原因：** API Key 未生效或 `AI_ENABLED = false`

**解决：**
1. 确认已正确配置 `QWEN_API_KEY`
2. 重新部署云函数
3. 查看云函数日志，确认是否调用了 API

---

#### 错误 5：回复很慢（超过10秒）

**原因：** 网络延迟或模型响应慢

**解决：**
1. 切换到 `qwen-turbo` 模型
2. 减少 `max_tokens` 参数（当前800）
3. 减少历史消息数量（当前6条）

---

## ⚙️ 高级配置

### 调整 AI 参数

**位置：** `cloudfunctions/aiChat/index.js` → `generateReplyWithAI` 函数

```javascript
parameters: {
  max_tokens: 800,      // 最大输出长度
  temperature: 0.7,     // 随机性 (0-1)
  top_p: 0.8,          // 采样范围
  result_format: 'message'
}
```

**参数说明：**

#### max_tokens（输出长度）
- 范围：100-2000
- 推荐：600-1000
- 影响：越大越详细，但费用越高

#### temperature（随机性）
- 范围：0.0-1.0
- 0.0 = 最保守，输出固定
- 0.7 = **推荐**，平衡
- 1.0 = 最有创造性

#### top_p（采样）
- 范围：0.0-1.0
- 0.8 = **推荐**，较稳定
- 0.95 = 更多样化

---

### 修改系统提示词

**位置：** `cloudfunctions/aiChat/index.js` → `generateReplyWithAI` 函数

```javascript
const systemPrompt = `你是一个专业的反诈骗AI助手...`
```

**优化建议：**
1. 添加学校特色（如"中央财经大学"）
2. 加入真实案例
3. 强调学生群体特点
4. 提供校内求助渠道

**示例：**
```javascript
const systemPrompt = `你是中央财经大学的反诈骗AI助手，专门为本校学生服务。

你需要特别关注大学生常见的诈骗类型：
1. 刷单兼职（最常见）
2. 校园贷、培训贷（危害大）
3. 网购退款诈骗
4. 杀猪盘（感情诈骗）
5. 虚假招聘

校内求助渠道：
• 保卫处电话：xxx-xxxx
• 辅导员：及时联系自己的辅导员
• 反诈专线：96110

回答时请：
1. 语言亲切，像学长学姐
2. 结合学校场景
3. 提供明确行动指南
4. 使用表情符号（⚠️ ✓ 💡）

请用专业、友好的态度帮助学生防范诈骗。`
```

---

### 调整历史消息数量

**位置：** `cloudfunctions/aiChat/index.js` → `generateReplyWithAI` 函数

```javascript
// 当前：保留最近3轮对话（6条消息）
messages.push(...history.slice(-6))

// 修改为2轮对话（节省费用）
messages.push(...history.slice(-4))

// 修改为5轮对话（更好的上下文）
messages.push(...history.slice(-10))
```

**建议：**
- 简单问答：2轮足够
- 复杂对话：3-5轮
- 费用优先：0-2轮

---

## 💰 费用管理

### 查看使用情况

**访问：** https://dashscope.console.aliyun.com/usage

**查看内容：**
- 每日调用次数
- Token 消耗量
- 费用明细

---

### 成本估算

**基于 qwen-turbo 模型：**

| 场景 | 每次对话 Token | 单次成本 | 1000次成本 |
|------|--------------|---------|-----------|
| 简单问答 | 500 tokens | ≈ 0.004元 | ≈ 4元 |
| 普通对话 | 1000 tokens | ≈ 0.008元 | ≈ 8元 |
| 复杂分析 | 2000 tokens | ≈ 0.016元 | ≈ 16元 |

**免费额度：** 1000万 tokens = 约 5000-10000 次对话

---

### 成本优化建议

#### 1. 模型选择
```javascript
const QWEN_MODEL = 'qwen-turbo'  // 最便宜，推荐
```

#### 2. 限制输出长度
```javascript
max_tokens: 600  // 从 800 降到 600
```

#### 3. 减少历史消息
```javascript
messages.push(...history.slice(-4))  // 从 6 条减到 4 条
```

#### 4. 添加频率限制
```javascript
// 每分钟最多10次调用
if (recentCalls.total > 10) {
  return { success: false, errMsg: '请求过于频繁' }
}
```

#### 5. 常见问题本地回复
```javascript
// 对于"你好"、"帮助"等常见问题，直接返回本地回复
if (message === '你好' || message === '帮助') {
  return generateReplyLocal(message)
}
```

---

## 🔒 安全建议

### 1. 保护 API Key

❌ **不要：**
- 上传到 Git 仓库（添加到 `.gitignore`）
- 在前端代码中暴露
- 分享给他人

✅ **应该：**
- 只在云函数中使用
- 定期更换
- 使用环境变量（生产环境）

---

### 2. 使用环境变量（推荐）

**步骤 1：** 设置环境变量
```
云开发控制台
→ 设置
→ 环境变量
→ 添加：QWEN_API_KEY = sk-xxxxxx
```

**步骤 2：** 修改代码
```javascript
const QWEN_API_KEY = process.env.QWEN_API_KEY || 'YOUR_API_KEY_HERE'
```

**步骤 3：** 重新部署

---

### 3. 添加频率限制

```javascript
// 每分钟最多10次
const recentCalls = await db.collection('chat_logs')
  .where({
    _openid: openid,
    createdAt: _.gte(new Date(Date.now() - 60000))
  })
  .count()

if (recentCalls.total > 10) {
  return {
    success: false,
    errMsg: '请求过于频繁，请稍后再试'
  }
}
```

---

### 4. 敏感词过滤

```javascript
const sensitiveWords = ['暴力', '色情', '政治', ...]
if (sensitiveWords.some(word => message.includes(word))) {
  return { reply: '抱歉，您的问题包含敏感内容。' }
}
```

---

## 📊 监控指标

### 关键指标

1. **调用成功率**
   - 目标：> 95%
   - 监控：云函数日志

2. **响应时间**
   - 目标：< 5秒
   - 优化：使用 qwen-turbo

3. **每日成本**
   - 目标：< 预算
   - 监控：灵积控制台

4. **用户满意度**
   - 收集反馈
   - 持续优化提示词

---

## 📚 相关文档

- **快速开始：** `QWEN_QUICK_START.md`（5分钟配置）
- **完整指南：** `QWEN_API_SETUP.md`（详细说明）
- **对话示例：** `QWEN_API_EXAMPLE.md`（效果展示）

---

## ✅ 部署检查清单

部署前确认：

- [ ] 已获取通义千问 API Key
- [ ] 已在 `index.js` 中填写 API Key
- [ ] 已执行 `npm install` 安装依赖
- [ ] 已上传并部署云函数
- [ ] 已在开发者工具中测试

测试确认：

- [ ] 发送"你好"，收到 AI 回复
- [ ] 发送诈骗相关问题，回复专业
- [ ] 连续对话，AI 理解上下文
- [ ] 查看云函数日志，无错误

上线准备：

- [ ] 配置环境变量（生产环境）
- [ ] 添加频率限制
- [ ] 优化系统提示词
- [ ] 设置费用预警

---

## 🎉 完成！

您的反诈骗小程序现在拥有了智能 AI 对话能力！

**下一步：**
1. 测试各种对话场景
2. 收集用户反馈
3. 持续优化提示词
4. 监控成本和性能

**祝您的小程序运行顺利！** 🚀

