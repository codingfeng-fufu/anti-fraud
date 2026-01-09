# CloudBase CMS 枚举字段说明

## 🔍 重要发现

CloudBase CMS 的**枚举类型字段**在数据库中存储的是**数字**，不是字符串！

## 📊 示例：status 字段

### CMS 界面显示
```
选项：
- draft（草稿）
- published（已发布）
```

### 数据库实际存储
```json
{
  "status": 1,  // draft（草稿）
  "status": 2   // published（已发布）
}
```

**不是存储字符串 "draft" 或 "published"！**

---

## 🔧 代码修正

### 错误写法 ❌
```javascript
db.collection('articles').where({
  status: 'published'  // ❌ 查不到数据
})
```

### 正确写法 ✅
```javascript
db.collection('articles').where({
  status: 2  // ✅ 2 代表 published
})
```

---

## 📋 其他可能的枚举字段

### tagType 字段

如果在 CMS 中配置为枚举：

**CMS 界面：**
```
选项：
- danger
- warning
- info
```

**数据库存储：**
```json
{
  "tagType": 1,  // danger
  "tagType": 2,  // warning
  "tagType": 3   // info
}
```

### category 字段

如果在 CMS 中配置为枚举：

**CMS 界面：**
```
选项：
- 刷单诈骗
- 校园贷
- 电信诈骗
...
```

**数据库存储：**
```json
{
  "category": 1,  // 刷单诈骗
  "category": 2,  // 校园贷
  "category": 3   // 电信诈骗
}
```

---

## 💡 建议

### 方案 A：使用数字查询（当前方案）✅

**优点：**
- 符合 CMS 实际存储格式
- 查询效率高

**缺点：**
- 代码可读性差
- 需要记住数字对应关系

**代码示例：**
```javascript
// 查询已发布的文章
db.collection('articles').where({
  status: 2  // 2 = published
})

// 添加注释说明
const STATUS = {
  DRAFT: 1,
  PUBLISHED: 2
}

db.collection('articles').where({
  status: STATUS.PUBLISHED  // 更清晰
})
```

---

### 方案 B：使用字符串字段（推荐新项目）

**配置 CMS 时：**
- 不使用"枚举"类型
- 使用"单行文本"类型
- 手动输入字符串值

**优点：**
- 代码可读性好
- 更灵活

**缺点：**
- 没有下拉选择
- 可能输入错误

---

## 🎯 最佳实践

### 在代码中定义常量

```javascript
// pages/index/index.js

// 定义状态常量
const ARTICLE_STATUS = {
  DRAFT: 1,        // 草稿
  PUBLISHED: 2     // 已发布
}

// 使用常量查询
const result = await db.collection('articles')
  .where({
    status: ARTICLE_STATUS.PUBLISHED  // 更清晰
  })
  .get()
```

### 在文档中说明枚举对应关系

```markdown
## 数据字段说明

### status（状态）
- 类型：枚举（Number）
- 值：
  - 1: draft（草稿）
  - 2: published（已发布）
```

---

## 🔍 如何确认枚举值

### 方法 1：查看数据库

1. 打开云开发控制台 → 数据库
2. 查看 articles 集合
3. 点击一条记录
4. 查看字段实际值

### 方法 2：在 CMS 中测试

1. 创建测试文章
2. 设置不同的状态
3. 到数据库中查看对应的数字
4. 记录对应关系

---

## 📝 当前项目配置

### status 字段
```
CMS 显示：draft, published
数据库存储：1, 2
查询使用：status: 2
```

### 其他字段（如果使用了枚举）

需要测试后确认：
- category
- tag
- tagType

---

## ⚠️ 注意事项

1. **枚举顺序很重要**
   - CMS 中选项的顺序决定了数字值
   - 第一个选项 = 1，第二个 = 2，以此类推

2. **不要修改 CMS 中的选项顺序**
   - 会导致数字对应关系错乱
   - 已有数据可能显示错误

3. **新增选项放在最后**
   - 避免影响已有数据

---

## 🚀 总结

**关键点：**
- CMS 枚举字段存储为数字
- 查询时使用数字，不是字符串
- 在代码中定义常量提高可读性

**当前配置：**
```javascript
status: 2  // 查询已发布的文章
```

---

**问题解决！** ✅
