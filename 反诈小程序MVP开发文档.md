# 反诈小程序 MVP 开发文档

## 一、项目概述

**项目名称：** 反诈卫士小程序

**项目目标：** 开发一款功能完善的反诈骗宣传小程序，通过新闻宣传、知识科普和AI智能对话等方式，提高用户的防诈骗意识和识别能力。

**目标用户：** 大学生群体

**开发平台：** 微信小程序 / 支付宝小程序 / H5

---

## 二、功能模块

### 2.1 反诈骗资讯与知识库

**功能说明：**
- 提供全面的反诈骗新闻和知识宣传
- 帮助用户及时了解最新的诈骗手段和防范措施

**主要功能：**
- 反诈骗新闻动态更新
- 防骗知识科普文章
- 典型案例分析

**分类体系：**
- **按人群分类：** 老年人、儿童、大学生、教师、企业员工等
- **按诈骗类型分类：** 杀猪盘、电信诈骗、钓鱼邮件、网络贷款诈骗、刷单诈骗、投资理财诈骗等

### 2.2 AI智能对话系统

**角色：** 反诈知识专家

**功能：**
- 解答用户关于反诈骗的各类问题
- 帮助识别可疑信息和诈骗行为
- 提供个性化的防骗建议
- 支持上传截图进行诈骗信息识别

### 2.3 用户系统

**功能：**
- 用户注册与登录
- 用户签到
- 完成日活积分
- 成就系统

---

## 三、页面结构

### 3.1 首页

**页面元素：**
- 顶部导航栏
- 搜索框
- 轮播图（3张banner）
- 分类标签（横向滚动）
- 新闻列表
  - 最新资讯区域
  - 防骗科普区域

**交互功能：**
- 搜索功能
- 轮播图自动切换（3秒/次）
- 分类筛选
- 新闻卡片点击查看详情

### 3.2 AI对话页

**页面元素：**
- 顶部导航
- 对话历史区域
- 输入框
- 发送按钮
- 上传截图按钮

**交互功能：**
- 文字消息发送
- AI回复
- 截图上传识别
- 对话历史滚动

### 3.3 我的页面

**页面元素：**
- 用户信息卡片
  - 头像
  - 昵称
  - 状态
- 数据统计卡片
  - 连续签到天数
  - 积分数
  - 获得成就数
- 功能菜单
  - 每日签到
  - 我的成就
  - 积分商城
  - 学习记录
  - 设置
  - 帮助与反馈
  - 关于我们

### 3.4 底部导航

**导航项：**
- 首页
- AI助手
- 我的

---

## 四、数据结构设计

### 4.1 用户表 (users)

```javascript
{
  id: String,              // 用户ID
  username: String,        // 用户名
  avatar: String,          // 头像URL
  phone: String,           // 手机号
  sign_days: Number,       // 连续签到天数
  points: Number,          // 积分
  achievements: Array,     // 成就列表
  created_at: Date,        // 注册时间
  last_login: Date         // 最后登录时间
}
```

### 4.2 新闻文章表 (articles)

```javascript
{
  id: String,              // 文章ID
  title: String,           // 标题
  content: String,         // 内容
  category_type: String,   // 分类类型（人群/诈骗类型）
  category: String,        // 具体分类
  tag: String,             // 标签（紧急预警/案例分析/知识科普等）
  view_count: Number,      // 浏览量
  publish_time: Date,      // 发布时间
  cover_image: String      // 封面图片
}
```

### 4.3 对话记录表 (chat_logs)

```javascript
{
  id: String,              // 记录ID
  user_id: String,         // 用户ID
  message: String,         // 消息内容
  role: String,            // 角色（user/bot）
  image_url: String,       // 截图URL（如有）
  created_at: Date         // 创建时间
}
```

### 4.4 成就表 (achievements)

```javascript
{
  id: String,              // 成就ID
  name: String,            // 成就名称
  description: String,     // 成就描述
  icon: String,            // 图标
  points: Number,          // 获得积分
  condition: Object        // 达成条件
}
```

### 4.5 签到记录表 (sign_records)

```javascript
{
  id: String,              // 记录ID
  user_id: String,         // 用户ID
  sign_date: Date,         // 签到日期
  points: Number           // 获得积分
}
```

### 4.6 轮播图表 (banners)

```javascript
{
  id: String,              // 轮播图ID
  title: String,           // 标题
  subtitle: String,        // 副标题
  image_url: String,       // 图片URL
  link_url: String,        // 跳转链接
  sort_order: Number,      // 排序
  status: Boolean          // 状态（显示/隐藏）
}
```

---

## 五、API接口设计

### 5.1 用户相关

```
POST   /api/user/register        # 用户注册
POST   /api/user/login           # 用户登录
GET    /api/user/info            # 获取用户信息
POST   /api/user/sign            # 用户签到
GET    /api/user/achievements    # 获取用户成就
```

### 5.2 文章相关

```
GET    /api/articles             # 获取文章列表
GET    /api/articles/:id         # 获取文章详情
GET    /api/articles/category    # 按分类获取文章
GET    /api/articles/search      # 搜索文章
```

### 5.3 AI对话相关

```
POST   /api/chat/message         # 发送消息
POST   /api/chat/image           # 上传截图识别
GET    /api/chat/history         # 获取对话历史
```

### 5.4 轮播图相关

```
GET    /api/banners              # 获取轮播图列表
```

---

## 六、技术栈建议

### 6.1 前端

**小程序框架：**
- 微信小程序原生开发
- 或 uni-app（支持多端）
- 或 Taro（React语法）

**UI组件库：**
- Vant Weapp（微信小程序）
- uni-ui（uni-app）

**状态管理：**
- 小程序原生（简单场景）
- Vuex / Pinia（复杂场景）

### 6.2 后端

**开发语言：**
- Node.js + Express / Koa
- Python + Flask / FastAPI
- Java + Spring Boot

**数据库：**
- MySQL（关系型数据）
- MongoDB（文档型数据）
- Redis（缓存）

**AI服务：**
- OpenAI API
- 讯飞星火
- 百度文心一言
- 阿里通义千问

**图片识别：**
- 腾讯云OCR
- 百度云OCR
- 阿里云OCR

### 6.3 部署

**服务器：**
- 阿里云 / 腾讯云
- Docker容器化部署

**CDN：**
- 静态资源CDN加速

---

## 七、开发流程建议

### Phase 1: 基础框架搭建（3-5天）
- 项目初始化
- 页面路由配置
- 底部导航实现
- 基础UI组件封装

### Phase 2: 首页开发（5-7天）
- 轮播图组件
- 分类标签
- 新闻列表
- 搜索功能
- 文章详情页

### Phase 3: AI对话开发（7-10天）
- 对话界面实现
- 消息发送与接收
- AI接口对接
- 截图上传识别
- 对话历史

### Phase 4: 用户中心开发（5-7天）
- 用户登录注册
- 签到功能
- 积分系统
- 成就系统
- 个人信息页

### Phase 5: 后端API开发（10-15天）
- 数据库设计与建表
- 用户认证
- 文章管理API
- AI对话API
- 签到积分API

### Phase 6: 测试与优化（3-5天）
- 功能测试
- 性能优化
- Bug修复
- 用户体验优化

---

## 八、关键功能实现说明

### 8.1 轮播图实现

**前端实现：**
```javascript
// 使用swiper组件
<swiper 
  autoplay 
  interval="3000" 
  indicator-dots
  circular>
  <swiper-item v-for="banner in banners" :key="banner.id">
    <image :src="banner.image_url" mode="aspectFill"></image>
  </swiper-item>
</swiper>
```

### 8.2 分类筛选实现

**数据结构：**
```javascript
categories: {
  人群分类: ['全部', '老年人', '儿童', '大学生', '教师', '企业员工'],
  诈骗类型: ['全部', '杀猪盘', '电信诈骗', '钓鱼邮件', '网络贷款', '刷单诈骗', '投资理财']
}
```

**筛选逻辑：**
```javascript
// 根据选中的分类过滤文章
filteredArticles() {
  if (this.selectedCategory === '全部') {
    return this.articles;
  }
  return this.articles.filter(item => 
    item.category === this.selectedCategory
  );
}
```

### 8.3 AI对话实现

**前端发送消息：**
```javascript
async sendMessage(content) {
  // 添加用户消息
  this.messages.push({
    role: 'user',
    content: content,
    timestamp: new Date()
  });
  
  // 调用AI接口
  const response = await api.chat.sendMessage({ content });
  
  // 添加AI回复
  this.messages.push({
    role: 'bot',
    content: response.data.message,
    timestamp: new Date()
  });
}
```

**后端AI接口：**
```javascript
// 调用第三方AI服务
async chat(userMessage) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "你是一个反诈骗知识专家..."
      },
      {
        role: "user",
        content: userMessage
      }
    ]
  });
  
  return response.data.choices[0].message.content;
}
```

### 8.4 签到功能实现

**签到逻辑：**
```javascript
async signIn(userId) {
  // 检查今天是否已签到
  const today = new Date().toDateString();
  const lastSign = await getLastSignRecord(userId);
  
  if (lastSign && lastSign.sign_date === today) {
    return { success: false, message: '今天已签到' };
  }
  
  // 计算连续签到天数
  const signDays = calculateSignDays(lastSign);
  
  // 计算获得积分（连续签到可加成）
  const points = 10 + Math.floor(signDays / 7) * 5;
  
  // 保存签到记录
  await saveSignRecord(userId, points);
  
  // 更新用户积分和连续签到天数
  await updateUser(userId, { 
    sign_days: signDays + 1,
    points: points 
  });
  
  return { 
    success: true, 
    signDays: signDays + 1, 
    points: points 
  };
}
```

### 8.5 积分成就系统

**成就配置示例：**
```javascript
achievements: [
  {
    id: 'sign_7',
    name: '初来乍到',
    description: '连续签到7天',
    icon: '🌟',
    points: 50,
    condition: { type: 'sign_days', value: 7 }
  },
  {
    id: 'read_10',
    name: '好学之徒',
    description: '阅读10篇文章',
    icon: '📚',
    points: 30,
    condition: { type: 'read_count', value: 10 }
  },
  {
    id: 'chat_5',
    name: 'AI助手',
    description: '使用AI对话5次',
    icon: '🤖',
    points: 20,
    condition: { type: 'chat_count', value: 5 }
  }
]
```

**成就检测：**
```javascript
async checkAchievements(userId) {
  const userStats = await getUserStats(userId);
  const userAchievements = await getUserAchievements(userId);
  
  for (let achievement of achievements) {
    // 如果已获得，跳过
    if (userAchievements.includes(achievement.id)) continue;
    
    // 检查是否满足条件
    const statValue = userStats[achievement.condition.type];
    if (statValue >= achievement.condition.value) {
      // 授予成就
      await grantAchievement(userId, achievement);
      // 增加积分
      await addPoints(userId, achievement.points);
    }
  }
}
```

---

## 九、注意事项

### 9.1 数据安全
- 用户密码加密存储（bcrypt）
- 敏感信息传输加密（HTTPS）
- 防止SQL注入
- XSS攻击防护

### 9.2 性能优化
- 图片懒加载
- 列表分页加载
- 缓存策略（Redis）
- CDN加速

### 9.3 用户体验
- 加载状态提示
- 错误提示友好
- 界面响应流畅
- 适配不同屏幕尺寸

### 9.4 内容管理
- 建立内容审核机制
- 定期更新反诈资讯
- AI回复质量监控
- 用户反馈收集

---

## 十、后续扩展方向

### 第二阶段功能（可选）
- 用户行为数据分析后台
- 社区分享功能
- 举报反馈通道
- 真伪查询功能
- 家庭守护模式
- 推送通知

### 运营方向
- 与公安部门合作
- 校园推广活动
- 用户激励机制完善
- 内容质量提升

---

## 十一、UI参考

已提供HTML原型文件：`anti-fraud-miniapp.html`

**设计风格：**
- 清新蓝青色调（#0ea5e9, #06b6d4）
- 圆角卡片设计
- 渐变色彩运用
- 扁平化图标

**交互规范：**
- 按钮点击反馈
- 页面切换动画
- 加载状态提示
- 错误提示友好

---

## 附录：开发检查清单

### 前端开发
- [ ] 项目初始化
- [ ] 页面路由配置
- [ ] 首页布局
- [ ] 轮播图组件
- [ ] 分类标签
- [ ] 新闻列表
- [ ] 文章详情页
- [ ] AI对话页
- [ ] 我的页面
- [ ] 登录注册页
- [ ] 签到功能
- [ ] 成就页面
- [ ] 底部导航

### 后端开发
- [ ] 数据库设计
- [ ] 用户认证系统
- [ ] 文章管理API
- [ ] AI对话接口
- [ ] 签到积分API
- [ ] 成就系统API
- [ ] 图片上传
- [ ] 数据统计

### 测试
- [ ] 功能测试
- [ ] 接口测试
- [ ] 性能测试
- [ ] 兼容性测试
- [ ] 安全测试

### 部署
- [ ] 服务器配置
- [ ] 域名备案
- [ ] HTTPS证书
- [ ] CDN配置
- [ ] 监控告警

---

**文档版本：** v1.0  
**最后更新：** 2026-01-07  
**联系方式：** [待填写]
