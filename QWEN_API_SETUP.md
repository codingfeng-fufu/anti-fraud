# 通义千问 API 接入指南

## 🎯 概述

本项目已集成**通义千问3 (Qwen3)** API，为聊天机器人提供智能对话能力。

---

## 📋 快速开始

### 第 1 步：获取 API Key

#### 1.1 注册阿里云账号

访问：https://www.aliyun.com/
- 如果已有账号，直接登录
- 新用户注册（建议实名认证）

#### 1.2 开通灵积服务

1. 访问：https://dashscope.aliyun.com/
2. 点击「开通服务」或「控制台」
3. 同意服务协议，开通灵积模型服务

#### 1.3 创建 API Key

1. 进入控制台：https://dashscope.console.aliyun.com/apiKey
2. 点击「创建新的 API Key」
3. 复制生成的 API Key（格式：`sk-xxxxxxxxxxxxxxxxxx`）
4. ⚠️ **妥善保管，不要泄露！**

---

### 第 2 步：配置 API Key

#### 2.1 打开云函数配置文件

```
cloudfunctions/aiChat/index.js
```

#### 2.2 填写 API Key

找到文件开头的配置区域：

```javascript
// ==================== 配置区域 ====================
// 🔑 在这里填写您的通义千问 API Key
const QWEN_API_KEY = 'YOUR_API_KEY_HERE'  // ⚠️ 请替换为您的真实 API Key
```

**修改为：**

```javascript
const QWEN_API_KEY = 'sk-xxxxxxxxxxxxxxxxxx'  // 替换成您的真实 API Key
```

#### 2.3 选择模型（可选）

```javascript
const QWEN_MODEL = 'qwen-turbo'  // 或使用 'qwen-plus', 'qwen-max'
```

**模型对比：**

| 模型 | 速度 | 质量 | 价格 | 适用场景 |
|------|------|------|------|---------|
| `qwen-turbo` | ⚡⚡⚡ 最快 | ⭐⭐⭐ 良好 | 💰 最低 | 日常对话、快速响应 |
| `qwen-plus` | ⚡⚡ 快 | ⭐⭐⭐⭐ 优秀 | 💰💰 中等 | 复杂分析、专业问答 |
| `qwen-max` | ⚡ 较慢 | ⭐⭐⭐⭐⭐ 最佳 | 💰💰💰 最高 | 高质量输出、深度分析 |

**推荐：** 使用 `qwen-turbo`，性价比最高，适合小程序场景。

---

### 第 3 步：安装依赖

在云函数目录下安装 axios：

#### 方法 1：使用开发者工具（推荐）

```
1. 右键点击 cloudfunctions/aiChat 文件夹
2. 选择「在终端中打开」
3. 执行命令：npm install
```

#### 方法 2：使用命令行

```bash
cd cloudfunctions/aiChat
npm install
```

---

### 第 4 步：上传部署云函数

#### 4.1 上传并部署

```
1. 右键点击 cloudfunctions/aiChat 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成
```

#### 4.2 验证部署

查看云函数日志，确认部署成功：
```
云开发控制台 → 云函数 → aiChat → 日志
```

---

### 第 5 步：测试对话

1. 重新编译小程序
2. 进入「AI助手」页面
3. 发送消息测试

**测试消息示例：**
```
你好
什么是刷单骗局？
如何识别网购退款诈骗？
我遇到了一个兼职，说日赚500，可信吗？
```

---

## 🔍 功能说明

### AI 智能回复

✅ **已启用 AI**（配置了 API Key）：
- 使用通义千问3进行智能对话
- 支持上下文理解（记忆最近3轮对话）
- 专业的反诈骗咨询服务
- 自然流畅的对话体验

❌ **未启用 AI**（未配置 API Key）：
- 使用本地关键词匹配
- 基础的诈骗类型识别
- 固定的回复模板

---

### 系统提示词（System Prompt）

AI 助手使用了专业的反诈骗提示词：

```
你是一个专业的反诈骗AI助手，为大学生提供反诈骗咨询服务。

你的任务是：
1. 帮助用户识别各类诈骗手段
2. 分析用户遇到的可疑情况
3. 提供专业的防骗建议
4. 以友好、专业、关心的态度回答问题
```

**你可以修改提示词**以适应不同场景！

修改位置：`cloudfunctions/aiChat/index.js` → `generateReplyWithAI` 函数 → `systemPrompt`

---

### 对话历史管理

- **自动保存**：所有对话记录存储在 `chat_logs` 集合
- **上下文支持**：AI 会参考最近3轮对话（6条消息）
- **智能理解**：支持连续对话，无需重复背景信息

---

## 💰 费用说明

### 免费额度

阿里云灵积服务提供**免费试用额度**：

- 新用户可获得**1000万 tokens** 的免费额度
- 足够小程序初期开发和测试使用

### 付费价格（2024年参考）

| 模型 | 输入价格 | 输出价格 | 示例成本 |
|------|---------|---------|---------|
| qwen-turbo | 0.002元/1K tokens | 0.006元/1K tokens | 1000次对话 ≈ 10-20元 |
| qwen-plus | 0.004元/1K tokens | 0.012元/1K tokens | 1000次对话 ≈ 20-40元 |
| qwen-max | 0.04元/1K tokens | 0.12元/1K tokens | 1000次对话 ≈ 200-400元 |

**成本优化建议：**
- 使用 `qwen-turbo` 模型
- 限制历史消息数量（当前为3轮）
- 减少 `max_tokens` 参数（当前为800）
- 为高频用户设置对话次数限制

---

## ⚙️ 高级配置

### 调整 AI 参数

在 `cloudfunctions/aiChat/index.js` 中修改：

```javascript
parameters: {
  max_tokens: 800,      // 最大输出长度（降低可节省费用）
  temperature: 0.7,     // 随机性 (0-1)，越低越保守
  top_p: 0.8,          // 采样范围 (0-1)
  result_format: 'message'
}
```

**参数说明：**

- **max_tokens**：回复的最大长度
  - 建议：600-1000
  - 越小越省钱，但回复可能不完整

- **temperature**：回复的创造性
  - 0.0 = 最保守（固定回复）
  - 0.7 = 平衡（推荐）
  - 1.0 = 最有创造性（可能不稳定）

- **top_p**：采样范围
  - 0.8 = 较稳定（推荐）
  - 0.95 = 更多样化

---

### 修改历史记录数量

```javascript
// 在 generateReplyWithAI 函数中修改
messages.push(...history.slice(-6))  // 保留3轮对话（6条消息）
```

**建议：**
- 简单问答：0-2轮（节省费用）
- 复杂对话：3-5轮（更好理解上下文）

---

### 添加敏感词过滤

在 `generateReplyWithAI` 函数开头添加：

```javascript
// 敏感词过滤
const sensitiveWords = ['暴力', '色情', '政治', ...]
if (sensitiveWords.some(word => message.includes(word))) {
  return '抱歉，您的问题包含敏感内容，我无法回答。'
}
```

---

### 启用日志记录

查看 API 调用详情：

```javascript
console.log('调用通义千问 API...', {
  messageCount: messages.length,
  model: QWEN_MODEL,
  tokens: message.length
})
```

在云函数日志中查看：
```
云开发控制台 → 云函数 → aiChat → 日志
```

---

## 🔒 安全建议

### 1. API Key 安全

❌ **不要**：
- 将 API Key 上传到公开的 Git 仓库
- 在前端代码中暴露 API Key
- 分享给他人

✅ **应该**：
- 只在云函数中使用
- 定期更换 API Key
- 使用环境变量存储（生产环境）

---

### 2. 使用环境变量（推荐）

**生产环境使用云开发环境变量：**

#### 步骤 1：设置环境变量

```
云开发控制台 → 设置 → 环境变量
添加：QWEN_API_KEY = sk-xxxxxxxxxx
```

#### 步骤 2：修改代码

```javascript
// 从环境变量读取 API Key
const QWEN_API_KEY = process.env.QWEN_API_KEY || 'YOUR_API_KEY_HERE'
```

#### 步骤 3：重新部署

```
上传并部署云函数
```

---

### 3. 请求频率限制

防止滥用，添加频率限制：

```javascript
// 在 exports.main 开头添加
const recentCalls = await db.collection('chat_logs')
  .where({
    _openid: openid,
    createdAt: _.gte(new Date(Date.now() - 60000))  // 最近1分钟
  })
  .count()

if (recentCalls.total > 10) {  // 每分钟最多10次
  return {
    success: false,
    errMsg: '请求过于频繁，请稍后再试',
    data: { reply: '请求过于频繁，请稍后再试。' }
  }
}
```

---

## 🐛 常见问题

### Q1: API 调用失败，提示 "Unauthorized"

**原因：** API Key 错误或未配置

**解决：**
1. 检查 API Key 是否正确复制
2. 确认 API Key 格式：`sk-xxxxxxxxxx`
3. 重新生成 API Key

---

### Q2: 回复速度很慢

**原因：** 网络延迟或模型选择

**解决：**
1. 切换到 `qwen-turbo` 模型
2. 减少 `max_tokens` 参数
3. 减少历史消息数量

---

### Q3: 提示 "axios is not defined"

**原因：** 依赖未安装

**解决：**
```bash
cd cloudfunctions/aiChat
npm install axios
```

然后**上传并部署：云端安装依赖**

---

### Q4: API 调用失败，降级到本地回复

**原因：** 多种可能

**排查步骤：**
1. 查看云函数日志
2. 检查 API Key 是否有效
3. 确认灵积服务已开通
4. 检查是否有免费额度或余额

---

### Q5: 回复内容不够专业

**解决：** 优化系统提示词

修改 `systemPrompt`，添加更多反诈骗知识：

```javascript
const systemPrompt = `你是中央财经大学的反诈骗AI助手...

常见诈骗类型：
1. 刷单兼职：...
2. 校园贷：...
3. 网购退款：...
...

请结合这些知识，为学生提供专业建议。`
```

---

## 📊 监控和优化

### 查看 API 使用情况

访问：https://dashscope.console.aliyun.com/usage

- **调用次数**：每天/每月的 API 调用统计
- **Token 消耗**：输入/输出 tokens 统计
- **费用明细**：每日费用详情

---

### 性能优化建议

1. **缓存常见问题**
   - 对于"你好"、"帮助"等常见问题，直接返回预设回复
   
2. **异步处理**
   - 对于非关键对话，可以异步记录日志
   
3. **用户分级**
   - VIP 用户：使用 AI 回复
   - 普通用户：限制调用次数或使用本地回复

---

## 🎉 完成！

现在您的反诈骗小程序已经拥有了智能 AI 对话能力！

### 下一步

- ✅ 测试各种对话场景
- ✅ 优化系统提示词
- ✅ 监控 API 使用情况
- ✅ 添加更多反诈骗知识
- ✅ 收集用户反馈，持续改进

---

## 📞 技术支持

**通义千问官方文档：**
- API 文档：https://help.aliyun.com/zh/dashscope/
- 模型介绍：https://dashscope.aliyun.com/models

**遇到问题？**
- 查看云函数日志
- 阅读官方文档
- 检查 API Key 配置

---

**祝您的反诈骗小程序运行顺利！** 🚀

