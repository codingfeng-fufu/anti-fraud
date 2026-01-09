# 首页文章动态数据功能说明

## 📝 功能概述

首页文章列表的时间和浏览量现在是**动态的**，不再是写死的静态文本。

---

## 🎯 核心改进

### 1️⃣ 动态时间显示

**改动前（静态）：**
```javascript
{
  time: '2小时前',  // 固定文本
  time: '昨天 18:30'
}
```

**改动后（动态）：**
```javascript
{
  timestamp: Date.now() - 2 * 60 * 60 * 1000,  // 存储时间戳
  time: formatRelativeTime(timestamp)           // 动态计算显示
}
```

**显示效果：**
- 刚刚（< 1分钟）
- 5分钟前
- 2小时前
- 昨天
- 3天前
- 1月8日（> 7天）

---

### 2️⃣ 动态浏览量

**改动前（静态）：**
```javascript
{
  views: '12.3k'  // 固定文本
}
```

**改动后（动态）：**
```javascript
{
  views: 12300,                    // 存储实际数字
  viewsText: formatViews(12300)    // 动态格式化为 "12.3k"
}
```

**格式化规则：**
- < 1000：显示原数字（如 `856`）
- 1000-9999：显示 `.k` 格式（如 `6.5k`）
- ≥ 10000：显示 `.w` 格式（如 `1.2w`）

---

### 3️⃣ 浏览量自动增加

**点击文章时：**
```javascript
viewArticle(e) {
  incrementViews(articleId)  // 浏览量 +1
  // 跳转到详情页
}
```

**效果：**
- 用户每次点击文章，浏览量自动 +1
- 数据保存到本地存储
- 刷新页面后浏览量保持

---

## 🔧 实现原理

### 工具函数 1：格式化相对时间

```javascript
function formatRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 1分钟) return '刚刚'
  if (diff < 1小时) return 'X分钟前'
  if (diff < 1天) return 'X小时前'
  if (diff < 2天) return '昨天'
  if (diff < 7天) return 'X天前'
  else return 'M月D日'
}
```

### 工具函数 2：格式化浏览量

```javascript
function formatViews(views) {
  if (views >= 10000) {
    return `${(views / 10000).toFixed(1)}w`  // 1.2w
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`   // 6.5k
  } else {
    return views.toString()                  // 856
  }
}
```

### 数据结构

```javascript
// 原始数据
{
  id: 1,
  tag: '紧急预警',
  tagType: 'danger',
  title: '警惕！"刷单兼职"骗局...',
  timestamp: 1736425200000,  // 时间戳
  views: 12300,              // 实际浏览数
  category: '刷单诈骗'
}

// 显示数据（经过格式化）
{
  ...原始数据,
  time: '2小时前',          // 格式化后的时间
  viewsText: '12.3k'        // 格式化后的浏览量
}
```

---

## 💾 本地存储

### 保存内容

```javascript
// 只保存会变化的数据
[
  { id: 1, views: 12301, timestamp: 1736425200000 },
  { id: 2, views: 8702, timestamp: 1736407200000 },
  ...
]
```

### 保存时机

- 用户点击文章后（浏览量增加）
- 保存到 `wx.setStorageSync('articles_data', ...)`

### 加载逻辑

```javascript
onLoad() {
  // 1. 从本地存储加载数据
  loadArticlesFromStorage()
  
  // 2. 合并浏览量数据
  // 将保存的浏览量更新到原始数据
  
  // 3. 格式化并显示
  updateArticlesList(allArticles)
}
```

---

## 🎨 用户体验

### 场景 1：时间动态更新

```
首次打开：文章显示"2小时前"
1小时后重新打开：文章显示"3小时前"  ✅ 自动更新
```

### 场景 2：浏览量实时增加

```
点击文章前：👁️ 12.3k
点击文章后：👁️ 12.3k（实际是 12301）
再次点击：👁️ 12.3k（实际是 12302）
刷新页面：浏览量保持 ✅
```

### 场景 3：格式化显示

```
856 次浏览 → 856
1,234 次浏览 → 1.2k
6,500 次浏览 → 6.5k
12,300 次浏览 → 12.3k
15,000 次浏览 → 1.5w
```

---

## 📊 数据流程

```
页面加载
  ↓
从本地存储读取浏览量数据
  ↓
合并到原始文章数据
  ↓
格式化时间和浏览量
  ↓
显示在页面上
  ↓
用户点击文章
  ↓
浏览量 +1
  ↓
保存到本地存储
  ↓
更新页面显示
```

---

## 🔄 生命周期

### onLoad（首次加载）
```javascript
1. 从本地存储加载数据
2. 格式化并显示所有文章
```

### onShow（每次显示）
```javascript
1. 重新计算相对时间（"2小时前"可能变成"3小时前"）
2. 更新页面显示
```

### 点击文章
```javascript
1. 浏览量 +1
2. 格式化新的浏览量
3. 保存到本地存储
4. 更新页面显示
5. 跳转到详情页
```

---

## 💡 技术细节

### 1. 相对时间计算

```javascript
const now = Date.now()
const timestamp = article.timestamp
const diff = now - timestamp

// 毫秒转换
const minute = 60 * 1000
const hour = 60 * minute
const day = 24 * hour
```

### 2. 浏览量格式化

```javascript
12300 → (12300 / 1000).toFixed(1) → "12.3" → "12.3k"
15000 → (15000 / 10000).toFixed(1) → "1.5" → "1.5w"
```

### 3. 本地存储策略

**为什么只存 `id`, `views`, `timestamp`？**
- 减少存储空间
- 其他数据（标题、标签等）不会变化，保留在代码中

**为什么使用 `wx.setStorageSync`？**
- 同步操作，保证数据立即保存
- 简单可靠

---

## 🧪 测试步骤

### 测试 1：时间显示

1. 编译运行小程序
2. 查看首页文章列表
3. 验证时间显示为相对时间（如"2小时前"）
4. 关闭并重新打开
5. 验证时间更新（如变成"3小时前"）

### 测试 2：浏览量增加

1. 查看某篇文章的浏览量（如"12.3k"）
2. 点击进入文章
3. 返回首页
4. 验证浏览量增加（可能仍显示"12.3k"，但实际是12301）
5. 多次点击，验证浏览量持续增加

### 测试 3：数据持久化

1. 点击几篇文章，增加浏览量
2. 完全关闭小程序
3. 重新打开
4. 验证浏览量保持（没有重置）

### 测试 4：分类和搜索

1. 切换不同分类
2. 验证时间和浏览量正确显示
3. 搜索关键词
4. 验证搜索结果的时间和浏览量正确

---

## 🔮 未来扩展

### 1. 云数据库集成

```javascript
// 将浏览量同步到云数据库
await db.collection('articles')
  .doc(articleId)
  .update({
    data: {
      views: _.inc(1)  // 原子操作，浏览量 +1
    }
  })
```

### 2. 实时统计

```javascript
// 实时获取最新浏览量
const realViews = await getArticleViews(articleId)
```

### 3. 发布时间显示

```javascript
// 除了相对时间，还显示具体时间
time: '2小时前',
publishTime: '2026-01-09 14:30'
```

### 4. 阅读时长统计

```javascript
// 记录用户在文章详情页停留时间
startTime: Date.now(),
readDuration: 0  // 秒
```

---

## ✨ 总结

**改进点：**
- ✅ 时间动态显示（相对时间）
- ✅ 浏览量动态格式化（k/w）
- ✅ 点击自动增加浏览量
- ✅ 数据持久化到本地存储
- ✅ 每次显示时更新时间

**效果：**
- 🎯 数据更真实
- 💡 显示更智能
- 🔄 交互更自然
- 💾 数据可持久化

---

**现在文章数据不再是写死的，而是动态的、可更新的！** ✨
