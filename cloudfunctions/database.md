# 云数据库设计文档

## 数据库集合（表）设计

### 1. users - 用户表

```javascript
{
  _id: "自动生成",
  _openid: "用户openid（自动生成）",
  uid: "用户唯一标识",      // 9位数字UID
  nickName: "用户昵称",
  avatarUrl: "头像URL",
  
  // 学生信息（新增）
  studentId: "学号",        // 学号（必填）
  realName: "真实姓名",     // 真实姓名（可选）
  schoolId: "学校ID",       // 学校ID
  schoolName: "学校名称",   // 学校名称
  collegeId: "院系ID",      // 院系ID
  collegeName: "院系名称",  // 院系名称
  majorId: "专业ID",        // 专业ID
  majorName: "专业名称",    // 专业名称
  grade: "年级",            // 年级（如：2023）
  className: "班级",        // 班级（可选）
  phone: "手机号",          // 手机号（可选）
  
  // 状态标记
  isVerified: false,        // 是否已认证
  verifiedAt: Date,         // 认证时间
  isBound: false,           // 是否已绑定学号
  
  // 原有字段
  signDates: [],           // 签到日期数组（YYYY-MM-DD格式）
  points: 0,                // 积分
  achievements: [],         // 已获得成就ID数组
  titles: [],               // 已获得称号ID数组
  equippedTitles: [],       // 已装备称号ID数组
  displayAchievementIds: [], // 主页展示成就ID数组（v3新增，最多6个）
  totalReadCount: 0,        // 总阅读数
  totalChatCount: 0,        // 总对话数
  continuousLearnDays: 0,   // 连续学习天数
  lastLearnDate: null,      // 最后学习日期
  lastChatDate: null,       // 最后聊天日期
  lastReadDate: null,       // 最后阅读日期

  // 趣味答题（v3新增）
  quizRewardDailyDate: "",     // 答题商城积分奖励日期（YYYY-MM-DD，北京时间）
  quizRewardDailyAwarded: 0,   // 今日已发放的答题商城积分（上限30）
  quizPoints: 0,               // 答题排行榜积分（累计答对题数）
  quizTotalAttempts: 0,        // 累计答题次数
  quizTotalCorrect: 0,         // 累计答对题数
  quizMaxCorrect: 0,           // 单次最高答对数（满分10）
  lastQuizAt: null,            // 最近一次答题时间

  createdAt: Date,          // 创建时间
  updatedAt: Date           // 更新时间
}
```

**索引：**
- `_openid` (唯一索引)
- `uid` (唯一索引)

**重要说明：**
- `uid`字段是9位数字，格式为：时间戳后6位 + 随机3位数字
- 新用户注册时自动生成UID和所有必需字段
- 老用户需要运行`fixUserData`云函数进行数据迁移和修复

### 2. articles - 文章表

```javascript
{
  _id: "自动生成",
  title: "文章标题",
  content: "文章内容（富文本）",
  category: "分类",          // 大学生/老年人/刷单诈骗等
  categoryType: "分类类型",   // 人群/诈骗类型
  tag: "标签",               // 紧急预警/案例分析/知识科普
  tagType: "标签类型",        // danger/warning/info
  coverImage: "封面图URL",
  viewCount: 0,             // 浏览量
  likeCount: 0,             // 点赞数
  publishTime: Date,        // 发布时间
  author: "作者",
  summary: "摘要"
}
```

**索引：**
- `category`
- `publishTime` (降序)

### 3. chat_logs - 对话记录表

```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  role: "角色",              // user/bot
  message: "消息内容",
  imageUrl: "图片URL",        // 可选
  createdAt: Date
}
```

**索引：**
- `_openid`
- `createdAt` (降序)

### 4. sign_records - 签到记录表

```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  userId: "用户ID",
  signDate: Date,           // 签到日期
  points: 10,               // 获得积分
  signDays: 1               // 连续签到天数
}
```

**索引：**
- `_openid`
- `signDate` (降序)

### 5. user_achievements - 用户成就表

```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  userId: "用户ID",
  achievementId: "成就ID",   // sign_7/read_10等
  achievementName: "成就名称",
  earnedAt: Date,           // 获得时间
  rewardTitleId: "奖励称号ID", // 可选
  pointsEarned: 10          // 获得积分
}
```

**索引：**
- `_openid`
- `achievementId`

### 6. points_records - 积分记录表

```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  userId: "用户ID",
  type: "earn",             // earn（获得）/ spend（消费）
  points: 10,               // 积分数量
  reason: "签到",           // 原因描述
  relatedId: "sign_2026-01-23", // 关联ID（可选）
  createdAt: Date           // 创建时间
}
```

**索引：**
- `_openid`
- `createdAt` (降序)
- `type`

### 7. read_records - 阅读记录表

```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  userId: "用户ID",
  articleId: "文章ID",
  readAt: Date              // 阅读时间
}
```

**索引：**
- `_openid`
- `articleId`
- `readAt` (降序)

### 8. schools - 学校表

```javascript
{
  _id: "自动生成",
  schoolId: "学校唯一标识",    // 如：HUST
  schoolName: "学校名称",      // 如：华中科技大学
  province: "省份",
  city: "城市",
  studentIdPattern: "学号格式", // 正则表达式，如：U\\d{10}
  studentIdExample: "学号示例", // 如：U2023010001
  logo: "学校logo URL",
  isActive: true,             // 是否启用
  createdAt: Date
}
```

**索引：**
- `schoolId` (唯一)

### 9. colleges - 院系表

```javascript
{
  _id: "自动生成",
  schoolId: "所属学校ID",
  collegeId: "院系唯一标识",
  collegeName: "院系名称",    // 如：计算机科学与技术学院
  shortName: "简称",          // 如：计算机学院
  isActive: true,
  createdAt: Date
}
```

**索引：**
- `schoolId`
- `collegeId`

### 10. majors - 专业表

```javascript
{
  _id: "自动生成",
  schoolId: "所属学校ID",
  collegeId: "所属院系ID",
  majorId: "专业唯一标识",
  majorName: "专业名称",      // 如：计算机科学与技术
  degree: "学位类型",         // 本科/硕士/博士
  isActive: true,
  createdAt: Date
}
```

**索引：**
- `schoolId`
- `collegeId`
- `majorId`

---

## v3 新增集合（社区/答题/社交/反馈）

### 11. public_profiles - 公共资料表（v3新增）

> 用于对外展示的“安全字段”，避免直接公开读取 users（含学号等敏感信息）。

```javascript
{
  _id: "uid",               // 建议与 uid 一致，便于 doc(uid) 查询
  uid: "用户UID",
  nickName: "用户昵称",
  avatarUrl: "头像URL",

  equippedTitleIds: [],      // 展示称号（<=3）
  displayAchievementIds: [], // 展示成就（<=6）

  quizPoints: 0,             // 答题排行榜积分（累计答对题数）
  quizTotalAttempts: 0,
  quizTotalCorrect: 0,
  quizMaxCorrect: 0,
  lastQuizAt: Date,

  followerCount: 0,
  followingCount: 0,

  createdAt: Date,
  updatedAt: Date
}
```

**索引：**
- `quizPoints`（降序）
- `nickName`

### 12. quiz_questions - 趣味答题题库表（v3新增）

```javascript
{
  _id: "q001",
  questionId: "q001",
  question: "题干",
  options: ["A","B","C","D"],
  answerIndex: 0,           // 仅服务端判分，不下发
  explanation: "解析",
  difficulty: 1-5,
  tags: [],
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 13. quiz_attempts - 答题记录表（v3新增）

```javascript
{
  _id: "自动生成",
  uid: "用户UID",
  questionIds: [],
  answers: [],
  correctCount: 0,
  earnedQuizPoints: 0,      // = correctCount
  earnedMallPoints: 0,      // = min(correctCount, 当日剩余额度<=30)
  createdAt: Date
}
```

### 14. posts - 社区帖子表（v3新增）

```javascript
{
  _id: "自动生成",
  authorUid: "作者UID",
  authorNickName: "作者昵称快照",
  authorAvatarUrl: "作者头像快照",
  content: "内容",
  images: [],
  status: "published",      // 预留：hidden
  commentCount: 0,
  likeCount: 0,
  createdAt: Date,
  updatedAt: Date
}
```

### 15. comments - 评论表（v3新增，文章/帖子通用）

```javascript
{
  _id: "自动生成",
  targetType: "article",    // article | post
  targetId: "目标ID",
  authorUid: "作者UID",
  authorNickName: "作者昵称快照",
  authorAvatarUrl: "作者头像快照",
  content: "评论内容",
  parentId: null,           // 一级评论为空；回复则为被回复评论ID
  replyToUid: null,         // 回复对象UID
  status: "published",      // 预留：hidden
  createdAt: Date,
  updatedAt: Date
}
```

### 16. follows - 关注关系表（v3新增）

```javascript
{
  _id: "followerUid_followeeUid", // 建议用该组合主键
  followerUid: "关注者UID",
  followeeUid: "被关注者UID",
  createdAt: Date
}
```

### 17. notifications - 站内通知表（v3新增）

```javascript
{
  _id: "自动生成",
  toUid: "接收者UID",
  fromUid: "触发者UID",
  type: "new_post",         // new_post | reply | ...
  payload: {},              // { postId?, targetType?, targetId?, commentId?, previewText? }
  isRead: false,
  createdAt: Date
}
```

### 18. scam_reports - 诈骗反馈表（v3新增）

```javascript
{
  _id: "自动生成",
  reporterUid: "反馈者UID",
  reporterNickName: "反馈者昵称快照",
  reporterAvatarUrl: "反馈者头像快照",
  type: "诈骗类型",
  channel: "渠道",
  scamAccount: "对方账号/电话",
  scamLink: "相关链接",
  content: "详细描述",
  images: [],
  createdAt: Date
}
```

---

## 数据库权限配置

### 推荐权限设置

1. **users 集合**
   - 仅创建者可写
   - 所有用户可读自己的数据

2. **articles 集合**
   - 所有用户可读
   - 仅管理员可写

3. **chat_logs 集合**
   - 仅创建者可读写

4. **sign_records 集合**
   - 仅创建者可读写

5. **user_achievements 集合**
   - 仅创建者可读

6. **points_records 集合**
   - 仅创建者可读写

7. **read_records 集合**
   - 仅创建者可读写

---

## 初始化数据

### 1. 创建示例文章

在云开发控制台 -> 数据库 -> articles 集合中导入以下数据：

```json
[
  {
    "title": "警惕！"刷单兼职"骗局又出新花样，多名学生被骗",
    "category": "大学生",
    "categoryType": "人群",
    "tag": "紧急预警",
    "tagType": "danger",
    "viewCount": 12300,
    "likeCount": 328,
    "publishTime": "2026-01-07T02:30:00.000Z",
    "content": "<p>近期，多名大学生在网上寻找兼职时遭遇"刷单诈骗"...</p>",
    "summary": "多名大学生遭遇刷单诈骗，损失金额从几百元到数万元不等",
    "author": "反诈中心"
  },
  {
    "title": "大学生网购遇"退款诈骗"，一步步掉入陷阱",
    "category": "大学生",
    "categoryType": "人群",
    "tag": "案例分析",
    "tagType": "warning",
    "viewCount": 8700,
    "likeCount": 215,
    "publishTime": "2026-01-07T00:15:00.000Z",
    "content": "<p>大三学生小李在某电商平台购买了一件衣服...</p>",
    "summary": "网购后接到假客服电话，被骗5000元",
    "author": "反诈中心"
  }
]
```

### 2. 配置云数据库规则

在云开发控制台设置数据库权限：

```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

---

## 使用说明

### 1. 初始化云开发环境

1. 打开微信开发者工具
2. 点击「云开发」按钮
3. 创建云开发环境（如果未创建）
4. 获取环境 ID，填入 `app.js` 中

### 2. 创建数据库集合

在云开发控制台 -> 数据库中创建以下集合：
- users
- articles
- chat_logs
- sign_records
- user_achievements
- points_records
- read_records
- public_profiles (v3)
- quiz_questions (v3)
- quiz_attempts (v3)
- posts (v3)
- comments (v3)
- follows (v3)
- notifications (v3)
- scam_reports (v3)
- schools
- colleges
- majors

### 3. 上传并部署云函数

1. 右键点击 `cloudfunctions/login` 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成
4. 重复以上步骤部署所有云函数

### 4. 测试云函数

在云开发控制台 -> 云函数中可以测试每个函数：

```javascript
// 测试 login 云函数
{
  "nickName": "测试用户",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

---

## 注意事项

1. **环境 ID**：记得在 `app.js` 中替换 `your-env-id` 为实际的云开发环境 ID

2. **云函数依赖**：每个云函数都需要安装 `wx-server-sdk` 依赖

3. **数据库权限**：根据实际需求调整权限设置

4. **成本控制**：
   - 免费额度：2GB 存储、5GB 流量
   - 云函数调用：10万次/月免费
   - 超出部分按量计费

5. **性能优化**：
   - 添加合适的数据库索引
   - 控制单次查询返回数据量
   - 使用缓存减少数据库查询

---

## 常见问题

### Q: 云函数调用失败？
A: 检查：
1. 云函数是否已上传部署
2. 环境 ID 是否正确
3. 云函数代码是否有语法错误
4. 查看云函数日志排查问题

### Q: 数据库写入失败？
A: 检查：
1. 数据库权限设置
2. 数据格式是否正确
3. 是否超出配额限制

### Q: 如何查看云函数日志？
A: 云开发控制台 -> 云函数 -> 选择函数 -> 日志

---

**文档更新时间**：2026-01-07
