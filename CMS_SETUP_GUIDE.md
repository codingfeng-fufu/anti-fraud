# CloudBase CMS 完整配置指南

## 🎯 为什么选择 CloudBase CMS

**核心优势：**
- ✅ **富文本编辑器**：所见即所得，支持格式化、图片、链接
- ✅ **图片管理**：一键上传到云存储，自动生成CDN链接
- ✅ **草稿系统**：随时保存，编辑到满意再发布
- ✅ **权限管理**：可添加多个管理员，设置不同权限
- ✅ **版本历史**：记录每次修改，可回溯
- ✅ **完全免费**：官方提供，不限制使用

---

## 🚀 完整部署步骤

### Step 1：安装 CMS 扩展

1. **打开云开发控制台（Web版）**
   ```
   https://console.cloud.tencent.com/tcb
   ```

2. **选择你的环境**
   - 环境ID：`cloud1-9g3v8lt8fb0108e7`

3. **进入「扩展能力」**
   - 左侧菜单 → 「扩展能力」

4. **找到「内容管理（CMS）」**
   - 在扩展列表中找到 CMS
   - 点击「安装」

5. **等待安装完成**
   - 大约需要 1-2 分钟
   - 安装成功后会显示「已安装」

---

### Step 2：配置内容模型（文章结构）

#### 2.1 创建内容模型

1. **进入 CMS 管理界面**
   - 点击「内容管理」→「打开管理后台」

2. **创建新的内容类型**
   - 点击「内容模型」→「新建」
   - 名称：`文章`（articles）
   - 描述：反诈知识文章

#### 2.2 定义字段

**基础信息：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| 标题 (title) | 单行文本 | ✅ | 文章标题 |
| 分类 (category) | 下拉选择 | ✅ | 刷单诈骗/校园贷/电信诈骗... |
| 标签 (tag) | 下拉选择 | ✅ | 紧急预警/案例分析/知识科普 |
| 标签类型 (tagType) | 下拉选择 | ✅ | danger/warning/info |

**内容：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| 封面图 (coverImage) | 图片 | ❌ | 文章封面（16:9） |
| 正文 (content) | 富文本 | ✅ | 文章正文，支持格式化 |
| 摘要 (summary) | 多行文本 | ❌ | 文章摘要（可选） |

**元数据：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| 作者 (author) | 单行文本 | ❌ | 默认：反诈小助手 |
| 浏览量 (views) | 数字 | ❌ | 初始值：0 |
| 点赞数 (likes) | 数字 | ❌ | 初始值：0 |
| 发布时间 (publishTime) | 日期时间 | ❌ | 自动生成 |
| 状态 (status) | 下拉选择 | ✅ | draft（草稿）/published（已发布） |

#### 2.3 配置下拉选项

**分类 (category) 选项：**
```
- 刷单诈骗
- 校园贷
- 电信诈骗
- 网购退款
- 杀猪盘
- 投资理财
- 大学生
```

**标签 (tag) 选项：**
```
- 紧急预警
- 案例分析
- 防骗知识
- 知识科普
- 视频教程
```

**标签类型 (tagType) 选项：**
```
- danger（红色，紧急）
- warning（橙色，警告）
- info（蓝色，普通）
```

**状态 (status) 选项：**
```
- draft（草稿）
- published（已发布）
```

---

### Step 3：添加管理员账号

1. **进入「用户管理」**
   - 在 CMS 后台左侧菜单

2. **添加管理员**
   - 点击「新建用户」
   - 输入用户名和密码
   - 设置权限（管理员/编辑）

3. **设置权限**
   - **管理员**：所有权限（增删改查）
   - **编辑**：只能编辑和发布

---

### Step 4：创建第一篇文章

#### 4.1 新建文章

1. **进入「内容管理」**
   - 点击「文章」→「新建」

2. **填写基础信息**
   ```
   标题：警惕！"刷单兼职"骗局又出新花样，多名学生被骗
   分类：刷单诈骗
   标签：紧急预警
   标签类型：danger
   作者：反诈小助手
   ```

3. **上传封面图**
   - 点击「封面图」字段
   - 上传图片（建议 16:9 比例）
   - 自动上传到云存储

#### 4.2 编辑正文

**富文本编辑器功能：**
- ✅ 加粗、斜体、下划线
- ✅ 标题（H1-H6）
- ✅ 有序列表、无序列表
- ✅ 插入图片
- ✅ 插入链接
- ✅ 代码块
- ✅ 引用
- ✅ 表格

**示例内容：**

```
近期，多名大学生遭遇"刷单兼职"诈骗，损失金额从数百元到数万元不等。骗子手法不断升级，请大家务必警惕！

## 骗局流程

1. **发布高薪招聘**
   诈骗分子在社交平台发布"日赚300-500"的刷单兼职广告

2. **小额返利建立信任**
   前几单小额刷单，快速返现，让受害者放松警惕

3. **诱导大额垫付**
   要求垫付大额资金，声称"任务量大，佣金更高"

4. **失联跑路**
   收到大额资金后，骗子立即失联，受害者血本无归

## 防范建议

• 正规企业不会让员工垫付资金
• 不要轻信高薪兼职广告
• 不要在陌生平台输入银行卡信息
• 如已被骗，立即拨打 96110 报警

> 提醒：凡是要求先付款、垫付资金的兼职，都是诈骗！
```

#### 4.3 预览文章

1. **点击「预览」按钮**
   - 查看最终显示效果

2. **调整格式**
   - 如有需要，继续编辑

#### 4.4 保存草稿

1. **点击「保存」按钮**
   - 文章保存为草稿状态
   - 不会在小程序中显示

2. **随时修改**
   - 可以回到文章列表
   - 点击文章继续编辑

#### 4.5 发布文章

1. **确认内容无误**
   - 再次预览

2. **设置状态为「已发布」**
   - 将 `status` 字段改为 `published`

3. **点击「保存」**
   - 文章正式发布
   - 小程序用户可见

---

## 📱 小程序端接入

### 修改 index.js，从云数据库读取文章

```javascript
// pages/index/index.js

// 在 onLoad 中加载文章
onLoad() {
  this.loadArticlesFromCloud()
},

// 从云数据库加载文章
async loadArticlesFromCloud() {
  wx.showLoading({ title: '加载中...' })
  
  try {
    const db = wx.cloud.database()
    
    // 查询已发布的文章
    const result = await db.collection('articles')
      .where({
        status: 'published'  // 只显示已发布的文章
      })
      .orderBy('publishTime', 'desc')  // 按发布时间倒序
      .limit(20)  // 最多20篇
      .get()
    
    if (result.data && result.data.length > 0) {
      // 处理数据
      const articles = result.data.map(article => ({
        id: article._id,
        title: article.title,
        tag: article.tag,
        tagType: article.tagType,
        category: article.category,
        content: article.content,
        coverImage: article.coverImage || '',
        timestamp: new Date(article.publishTime).getTime(),
        views: article.views || 0,
        author: article.author || '反诈小助手'
      }))
      
      this.setData({
        allArticles: articles
      })
      
      this.updateArticlesList(articles)
    }
    
    wx.hideLoading()
  } catch (err) {
    console.error('加载文章失败：', err)
    wx.hideLoading()
    
    // 失败时使用本地数据
    wx.showToast({
      title: '加载失败，使用离线数据',
      icon: 'none'
    })
    
    // 保持原有的本地数据作为备份
    this.updateArticlesList(this.data.allArticles)
  }
},

// 刷新文章列表
onPullDownRefresh() {
  this.loadArticlesFromCloud().then(() => {
    wx.stopPullDownRefresh()
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  })
}
```

### 修改文章详情页，显示富文本内容

```javascript
// pages/article-detail/article-detail.js
Page({
  data: {
    article: null
  },
  
  onLoad(options) {
    const { id } = options
    this.loadArticle(id)
  },
  
  async loadArticle(id) {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const db = wx.cloud.database()
      const result = await db.collection('articles')
        .doc(id)
        .get()
      
      if (result.data) {
        this.setData({
          article: result.data
        })
        
        // 增加浏览量
        this.incrementViews(id)
      }
      
      wx.hideLoading()
    } catch (err) {
      console.error('加载文章失败：', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },
  
  async incrementViews(id) {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      
      await db.collection('articles').doc(id).update({
        data: {
          views: _.inc(1)  // 浏览量 +1
        }
      })
    } catch (err) {
      console.error('更新浏览量失败：', err)
    }
  }
})
```

```xml
<!-- pages/article-detail/article-detail.wxml -->
<view class="article-container">
  <!-- 标题 -->
  <view class="article-header">
    <view class="tag tag-{{article.tagType}}">{{article.tag}}</view>
    <text class="article-title">{{article.title}}</text>
    <view class="article-meta">
      <text>{{article.author}}</text>
      <text>·</text>
      <text>{{article.publishTime}}</text>
      <text>·</text>
      <text>👁️ {{article.views}}</text>
    </view>
  </view>
  
  <!-- 封面图 -->
  <image wx:if="{{article.coverImage}}" 
         class="cover-image" 
         src="{{article.coverImage}}" 
         mode="widthFix">
  </image>
  
  <!-- 正文（富文本） -->
  <view class="article-content">
    <rich-text nodes="{{article.content}}"></rich-text>
  </view>
</view>
```

---

## 🎨 CMS 界面预览

### 1. 文章列表

```
┌─────────────────────────────────────────────────┐
│  反诈小程序 CMS                    [+ 新建文章]  │
├─────────────────────────────────────────────────┤
│  🔍 搜索：[___________]  分类：[全部▼]         │
├─────────────────────────────────────────────────┤
│  ☑  标题              分类   状态    浏览  操作 │
│  ☐  刷单骗局又出...   刷单   已发布  12.3k  编辑 │
│  ☐  校园贷陷阱揭秘... 校园贷  草稿   0      编辑 │
│  ☐  网购退款诈骗...   网购   已发布  8.7k   编辑 │
└─────────────────────────────────────────────────┘
```

### 2. 文章编辑

```
┌─────────────────────────────────────────────────┐
│  [返回]  编辑文章              [保存] [预览] [发布] │
├─────────────────────────────────────────────────┤
│  标题：[警惕！"刷单兼职"骗局...]               │
│  分类：[刷单诈骗 ▼]  标签：[紧急预警 ▼]       │
│  封面：[📷 上传图片] [预览]                    │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ 【B】【I】【U】 H1▼ • 🔗 📷 ≡          │  │ ← 工具栏
│  ├─────────────────────────────────────────┤  │
│  │                                           │  │
│  │  近期，多名大学生遭遇"刷单兼职"诈骗... │  │
│  │                                           │  │ ← 编辑区
│  │  ## 骗局流程                             │  │
│  │  1. 发布高薪招聘                         │  │
│  │  2. 小额返利建立信任                     │  │
│  │  ...                                      │  │
│  │                                           │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  状态：○ 草稿  ● 已发布                       │
└─────────────────────────────────────────────────┘
```

### 3. 图片上传

```
┌─────────────────────────────────────────────────┐
│  上传图片                           [从本地选择]  │
├─────────────────────────────────────────────────┤
│                                                 │
│     [拖拽图片到这里或点击上传]                  │
│                                                 │
│  支持格式：JPG, PNG, GIF                        │
│  建议尺寸：1200×675 (16:9)                      │
│  最大大小：5MB                                  │
│                                                 │
├─────────────────────────────────────────────────┤
│  已上传：                                       │
│  [缩略图]  cover.jpg  (1.2MB)  [✓] [×]        │
│                                                 │
│  CDN链接：https://xxx.tcb.qcloud.la/cover.jpg  │
└─────────────────────────────────────────────────┘
```

---

## 💡 使用技巧

### 1. 富文本编辑器快捷键

- `Ctrl + B`：加粗
- `Ctrl + I`：斜体
- `Ctrl + U`：下划线
- `Ctrl + K`：插入链接
- `Ctrl + S`：保存

### 2. 图片优化建议

- **封面图**：1200×675 (16:9)
- **正文图片**：宽度 800px
- **格式**：JPEG（照片）、PNG（图标）
- **大小**：< 500KB（自动压缩）

### 3. 文章标题建议

- 长度：15-30 字
- 包含关键词："警惕"、"揭秘"、"防范"
- 使用数字："5种"、"3招"
- 吸引眼球："又出新花样"、"千万别"

### 4. 内容结构建议

```
标题
  ↓
引言（100字以内，概述问题）
  ↓
主体内容
  • 问题描述
  • 案例分析
  • 骗局流程
  • 识别要点
  • 防范建议
  ↓
总结（强调重点，给出行动建议）
```

---

## 🔐 权限管理

### 角色设置

**超级管理员：**
- 所有权限
- 管理其他用户
- 删除已发布文章

**编辑：**
- 创建文章
- 编辑自己的文章
- 发布文章
- 不能删除已发布文章

**审核员：**
- 查看所有文章
- 审核待发布文章
- 不能编辑和删除

---

## 📊 数据统计

CMS 提供基础统计：
- 文章总数
- 已发布/草稿数量
- 总浏览量
- 最近更新

**自定义统计：**
可以在云函数中实现：
```javascript
// 获取统计数据
const db = wx.cloud.database()

const totalArticles = await db.collection('articles').count()
const publishedCount = await db.collection('articles')
  .where({ status: 'published' })
  .count()

const totalViews = await db.collection('articles')
  .aggregate()
  .group({
    _id: null,
    total: db.command.aggregate.sum('$views')
  })
  .end()
```

---

## 🚀 上线检查清单

### 发布文章前检查

- [ ] 标题简洁有力，15-30字
- [ ] 分类和标签正确
- [ ] 封面图清晰美观（16:9）
- [ ] 正文格式正确，无错别字
- [ ] 链接可正常访问
- [ ] 图片加载正常
- [ ] 预览效果满意
- [ ] 状态设置为「已发布」

### 小程序端检查

- [ ] 文章列表正常显示
- [ ] 点击进入详情页
- [ ] 富文本内容正确显示
- [ ] 图片可正常加载
- [ ] 浏览量正常增加
- [ ] 分类筛选正常
- [ ] 搜索功能正常

---

## ✨ 总结

**CloudBase CMS 解决了：**
- ✅ 文章编辑（富文本编辑器）
- ✅ 图片管理（自动上传到云存储）
- ✅ 草稿系统（随时保存）
- ✅ 权限管理（多个管理员）
- ✅ 版本历史（可回溯）

**工作流程：**
```
CMS编辑文章 → 保存到云数据库 → 小程序读取显示
```

**下一步：**
1. 安装 CloudBase CMS
2. 配置内容模型
3. 创建第一篇文章
4. 修改小程序代码从数据库读取
5. 测试发布流程

---

**开始使用 CloudBase CMS，5分钟搞定文章管理！** 🚀
