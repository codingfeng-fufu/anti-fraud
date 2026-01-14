# 反诈卫士 - 大学生反诈骗教育小程序

<div align="center">

[![微信小程序](https://img.shields.io/badge/微信小程序-反诈卫士-07C160?logo=wechat&logoColor=white)](https://mp.weixin.qq.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Cloud](https://img.shields.io/badge/云开发-微信云-07C160)](https://cloud.weixin.qq.com/)

一款专为大学生设计的反诈骗教育小程序，集成AI智能助手，提供实时诈骗识别与防范建议。

</div>

---

## 📖 项目简介

**反诈卫士**是一款基于微信小程序和云开发技术的反诈骗教育平台，旨在帮助大学生识别和防范各类诈骗行为。项目集成了通义千问AI大模型，提供智能化的反诈骗咨询服务。

### 核心功能

- 🛡️ **反诈知识库** - 提供丰富的防骗文章，涵盖刷单诈骗、校园贷、网购退款等常见骗局
- 🤖 **AI智能助手** - 集成通义千问API，实时解答用户疑问，分析可疑情况
- 🎓 **学生认证** - 支持学号绑定，针对性提供校园防诈骗内容
- ✅ **签到打卡** - 每日签到获取积分，激励用户持续学习
- 🏆 **成就系统** - 通过阅读、签到等行为解锁成就，增强用户参与感
- 📊 **个人中心** - 管理个人信息、查看学习进度和积分

---

## 🎯 项目特色

### 1. AI 智能对话
- 集成**通义千问3**大语言模型
- 支持**上下文记忆**（保留最近5轮对话）
- 智能识别诈骗类型并提供专业建议
- 隐私保护：对话记录仅存储在用户本地

### 2. 分类内容管理
- 支持多种诈骗类型分类：刷单诈骗、校园贷、网购退款、杀猪盘、投资理财等
- 文章标签系统：紧急预警、案例分析、防骗知识、知识科普等
- 实时浏览量统计与排序

### 3. 云端数据同步
- 文章内容云端管理（支持CMS内容管理）
- 用户数据云端存储
- 轮播图动态配置
- 离线数据降级方案

### 4. 游戏化激励机制
- 每日签到奖励积分
- 阅读文章增加经验
- 成就系统激励学习
- 首次绑定学号奖励50积分

---

## 🛠️ 技术栈

### 前端
- **框架**: 微信小程序原生框架
- **UI**: 自定义组件 + WXSS样式
- **状态管理**: 本地缓存 + 云端同步

### 后端
- **云开发**: 微信云开发（Cloud Base）
- **数据库**: 云数据库（NoSQL）
- **云函数**: Node.js
- **云存储**: 用于存储用户头像、轮播图等

### AI服务
- **模型**: 通义千问（Qwen-Turbo/Plus/Max）
- **接入**: 阿里云DashScope API

---

## 📁 项目结构

```
miniprogram-14/
├── app.js                    # 小程序入口文件
├── app.json                  # 小程序配置文件
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json             # 搜索优化配置
│
├── pages/                   # 页面目录
│   ├── index/              # 首页 - 文章列表
│   ├── chat/               # AI聊天页面
│   ├── user/               # 用户中心
│   ├── article-detail/     # 文章详情
│   ├── bind-student/       # 学生信息绑定
│   ├── achievements/       # 成就页面
│   ├── points/            # 积分页面
│   ├── learning/          # 学习记录
│   ├── settings/          # 设置页面
│   ├── feedback/          # 反馈页面
│   └── about/             # 关于页面
│
├── cloudfunctions/         # 云函数目录
│   ├── login/             # 用户登录/注册
│   ├── aiChat/            # AI对话服务
│   ├── bindStudent/       # 学生信息绑定
│   ├── userSignIn/        # 用户签到
│   ├── getArticles/       # 获取文章列表
│   ├── getArticleDetail/  # 获取文章详情
│   └── getSchools/        # 获取学校列表
│
├── images/                 # 图片资源
│   ├── 反诈骗.png
│   ├── 个人中心.png
│   └── ai-聊天-思考.png
│
└── utils/                  # 工具函数
    └── util.js
```

---

## 🚀 快速开始

### 环境要求
- 微信开发者工具 >= 1.06.0
- 微信小程序基础库 >= 2.2.3
- Node.js >= 12.0（用于云函数开发）

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/your-repo/miniprogram-14.git
cd miniprogram-14
```

#### 2. 配置小程序 AppID
在 `project.config.json` 中修改 `appid`：
```json
{
  "appid": "你的小程序AppID"
}
```

#### 3. 配置云开发环境
在 `app.js` 中修改云环境ID：
```javascript
wx.cloud.init({
  env: 'your-cloud-env-id', // 替换为你的云环境ID
  traceUser: true,
})
```

#### 4. 配置通义千问 API Key（可选）
在 `cloudfunctions/aiChat/index.js` 中配置：
```javascript
const QWEN_API_KEY = 'sk-your-api-key-here'
```

> 💡 **提示**: 如果不配置API Key，AI助手将使用本地关键词匹配回复。

#### 5. 部署云函数
在微信开发者工具中，右键每个云函数文件夹，选择：
- **上传并部署：云端安装依赖**

需要部署的云函数：
- `login`
- `aiChat`
- `bindStudent`
- `userSignIn`
- `getArticles`
- `getArticleDetail`
- `getSchools`

#### 6. 创建数据库集合
在云开发控制台创建以下数据库集合：

| 集合名称 | 说明 | 权限设置 |
|---------|------|---------|
| `users` | 用户信息 | 仅创建者可读写 |
| `articles` | 文章数据 | 所有用户可读，仅管理员可写 |
| `banners` | 轮播图数据 | 所有用户可读，仅管理员可写 |
| `schools` | 学校信息 | 所有用户可读 |
| `bind_logs` | 绑定日志 | 仅创建者可读写 |

#### 7. 运行项目
在微信开发者工具中点击**编译**即可预览。

---

## 📊 数据库设计

### users 集合
```javascript
{
  _id: ObjectId,
  _openid: String,          // 用户唯一标识
  nickName: String,         // 昵称
  avatarUrl: String,        // 头像云存储路径
  studentId: String,        // 学号（可选）
  schoolId: String,         // 学校ID（可选）
  schoolName: String,       // 学校名称（可选）
  isBound: Boolean,         // 是否绑定学号
  signDays: Number,         // 连续签到天数
  points: Number,           // 积分
  achievements: Array,      // 成就列表
  totalReadCount: Number,   // 阅读文章数
  totalChatCount: Number,   // AI对话次数
  lastSignDate: String,     // 最后签到日期（YYYY-MM-DD）
  createdAt: Date,          // 创建时间
  updatedAt: Date           // 更新时间
}
```

### articles 集合
```javascript
{
  _id: ObjectId,
  title: String,            // 文章标题
  tag: String,              // 标签（紧急预警/案例分析/防骗知识等）
  tagType: String,          // 标签类型（danger/warning/info）
  category: String,         // 分类（刷单诈骗/校园贷/网购退款等）
  content: String,          // 文章内容（富文本）
  coverImage: String,       // 封面图（云存储路径）
  author: String,           // 作者
  views: Number,            // 浏览量
  timestamp: Number,        // 发布时间戳
  status: String            // 状态（1=草稿, 2=已发布）
}
```

### banners 集合
```javascript
{
  _id: ObjectId,
  title: String,            // 标题
  desc: String,             // 描述
  icon: String,             // 图标（emoji或URL）
  image: String,            // 图片（云存储路径）
  bgColor: String,          // 背景色/渐变
  link: String,             // 跳转链接
  sort: Number,             // 排序（升序）
  status: Boolean           // 是否启用
}
```

---

## 🔑 云函数说明

### login - 用户登录
**功能**: 获取用户openid，自动创建/更新用户信息

**输入参数**:
```javascript
{
  nickName: String,  // 昵称（可选）
  avatarUrl: String  // 头像（可选）
}
```

**返回数据**:
```javascript
{
  success: Boolean,
  data: {
    openid: String,
    userInfo: Object
  }
}
```

### aiChat - AI对话
**功能**: 调用通义千问API，生成智能回复

**输入参数**:
```javascript
{
  message: String,      // 用户消息
  history: Array,       // 对话历史（最近5轮）
  imageUrl: String      // 图片URL（可选，暂不支持）
}
```

**返回数据**:
```javascript
{
  success: Boolean,
  data: {
    reply: String       // AI回复内容
  }
}
```

### bindStudent - 绑定学生信息
**功能**: 验证并绑定学号，奖励积分

**输入参数**:
```javascript
{
  studentId: String,     // 学号（必填，10位数字）
  schoolId: String,      // 学校ID（必填）
  schoolName: String,    // 学校名称
  realName: String,      // 真实姓名（可选）
  grade: String,         // 年级（可选）
  // ... 其他可选字段
}
```

**返回数据**:
```javascript
{
  success: Boolean,
  data: {
    userInfo: Object,
    isFirstBind: Boolean,
    rewardPoints: Number  // 首次绑定奖励50积分
  }
}
```

### userSignIn - 用户签到
**功能**: 每日签到，增加积分和连续天数

**返回数据**:
```javascript
{
  success: Boolean,
  data: {
    signDays: Number,      // 连续签到天数
    points: Number,        // 当前总积分
    earnedPoints: Number,  // 本次获得积分
    lastSignDate: String   // 签到日期（YYYY-MM-DD）
  },
  message: String          // 签到成功消息
}
```

---

## 🎨 界面展示

### 首页
- 轮播图展示反诈骗知识要点
- 分类筛选（全部/刷单诈骗/校园贷/网购退款等）
- 文章列表（标签、标题、浏览量、发布时间）
- 搜索功能

### AI助手
- 实时对话界面
- 支持文字输入
- 上下文记忆（5轮对话）
- 隐私提示：对话仅保存本地
- 清除历史记录功能

### 用户中心
- 头像和昵称展示（可编辑）
- 签到打卡（显示连续天数）
- 积分、成就数据展示
- 功能入口：学习记录、积分商城、设置、反馈、关于

---

## 🔐 隐私保护

本项目高度重视用户隐私：

✅ **AI对话记录**：仅保存在用户手机本地，不上传到服务器  
✅ **上下文记忆**：临时存储在前端，不持久化到数据库  
✅ **数据权限**：用户数据仅创建者可读写  
✅ **学号验证**：支持学生身份验证，但不强制要求  

---

## ⚙️ 配置说明

### 通义千问 API 配置

1. **获取 API Key**
   - 访问[阿里云DashScope](https://dashscope.aliyun.com/)
   - 注册并创建应用
   - 复制 API Key

2. **配置云函数**
   修改 `cloudfunctions/aiChat/index.js`：
   ```javascript
   const QWEN_API_KEY = 'sk-your-api-key-here'
   const QWEN_MODEL = 'qwen-turbo'  // 或 'qwen-plus', 'qwen-max'
   ```

3. **调整超时时间**
   在云开发控制台，设置 `aiChat` 云函数超时时间为 **20秒**

### 云函数依赖

`aiChat` 云函数需要安装 `axios`：

在云函数目录下创建 `package.json`：
```json
{
  "name": "aiChat",
  "version": "1.0.0",
  "dependencies": {
    "wx-server-sdk": "latest",
    "axios": "^1.6.0"
  }
}
```

然后在微信开发者工具中右键云函数，选择**上传并部署：云端安装依赖**。

---

## 📝 开发计划

### 已完成
- ✅ 用户登录与信息管理
- ✅ AI智能对话（通义千问集成）
- ✅ 文章列表与详情展示
- ✅ 分类筛选与搜索
- ✅ 签到打卡系统
- ✅ 积分系统
- ✅ 学生信息绑定
- ✅ 云端数据同步

### 开发中
- 🚧 图片识别功能（OCR + 多模态AI）
- 🚧 成就系统详细页面
- 🚧 学习记录可视化
- 🚧 积分商城

### 计划中
- 📅 社区互动功能
- 📅 每日反诈骗测验
- 📅 案例分析视频
- 📅 防骗能力评估
- 📅 分享功能（生成反诈海报）

---

## 🤝 贡献指南

欢迎贡献代码、提出建议或报告问题！

### 贡献方式
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 代码规范
- 使用 2 空格缩进
- 变量和函数使用驼峰命名
- 添加必要的注释
- 遵循微信小程序最佳实践

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 👥 联系方式

如有问题或建议，欢迎联系：

- **项目负责人**: 
- **邮箱**: 
- **微信**: 

---

## 🙏 致谢

感谢以下开源项目和服务：

- [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [通义千问 (Qwen)](https://tongyi.aliyun.com/)
- [阿里云 DashScope](https://dashscope.aliyun.com/)

---

## 📌 免责声明

本项目仅供学习和研究使用，提供的反诈骗知识仅作为参考。如遇到实际诈骗情况，请及时拨打：

- **全国反诈专线**: 96110
- **报警电话**: 110

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个星标支持！**

Made with ❤️ by 反诈卫士团队

</div>
