# 加载文章失败诊断指南

## 可能的原因和解决方案

### 1. 云开发环境未初始化
**检查方法：**
- 打开 `app.js`，查看云开发环境 ID 是否正确配置
- 在微信开发者工具中点击"云开发"按钮，确认环境已创建

**解决方案：**
```javascript
// app.js 中应该有类似配置
wx.cloud.init({
  env: 'your-env-id', // 替换为你的云开发环境ID
  traceUser: true
})
```

### 2. 云函数未部署或版本过旧
**检查方法：**
- 在微信开发者工具中，右键点击 `cloudfunctions/getArticles` 文件夹
- 查看是否有"上传并部署"选项

**解决方案：**
1. 右键点击 `cloudfunctions/getArticles`
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成（查看控制台输出）

### 3. 数据库权限配置问题
**检查方法：**
- 打开微信开发者工具
- 点击"云开发" -> "数据库"
- 选择 `articles` 集合
- 点击"权限设置"

**解决方案：**
设置 `articles` 集合权限为：
```json
{
  "read": true,
  "write": false
}
```
或者使用自定义安全规则：
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

### 4. articles 集合不存在或无数据
**检查方法：**
- 云开发控制台 -> 数据库 -> 查看是否有 `articles` 集合
- 查看集合中是否有数据

**解决方案：**
如果没有数据，需要先导入测试数据或使用初始化云函数。

### 5. 网络问题或云函数超时
**检查方法：**
- 查看微信开发者工具的控制台（Console）
- 查看是否有网络错误或超时提示

**解决方案：**
- 检查网络连接
- 在云开发控制台查看云函数日志
- 增加云函数超时时间

## 调试步骤

### 步骤1：查看控制台错误信息
在 `pages/index/index.js` 的 `loadArticlesFromCloud` 方法中，错误信息会打印到控制台：
```javascript
console.error('加载文章失败：', err)
```

打开微信开发者工具的"控制台"标签，查看具体错误信息。

### 步骤2：测试云函数
在云开发控制台测试 `getArticles` 云函数：

1. 打开云开发控制台
2. 点击"云函数"
3. 选择 `getArticles`
4. 点击"测试"
5. 输入测试参数：
```json
{
  "category": "全部",
  "page": 1,
  "pageSize": 10
}
```
6. 查看返回结果

### 步骤3：检查数据库
1. 打开云开发控制台
2. 点击"数据库"
3. 查看 `articles` 集合
4. 确认有数据且字段完整

### 步骤4：添加详细日志
临时修改 `pages/index/index.js`，添加更详细的日志：

```javascript
async loadArticlesFromCloud(isRefresh = false) {
  console.log('=== 开始加载文章 ===')
  console.log('参数：', { isRefresh, currentPage: this.data.currentPage, pageSize: this.data.pageSize })
  
  // ... 原有代码 ...
  
  try {
    console.log('调用云函数，参数：', {
      name: 'getArticles',
      category: this.data.selectedCategory,
      page: this.data.currentPage,
      pageSize: this.data.pageSize
    })
    
    const res = await wx.cloud.callFunction({
      name: 'getArticles',
      data: {
        category: this.data.selectedCategory,
        page: this.data.currentPage,
        pageSize: this.data.pageSize
      }
    })
    
    console.log('云函数原始返回：', JSON.stringify(res, null, 2))
    
    // ... 后续代码 ...
  } catch (err) {
    console.error('=== 加载失败详情 ===')
    console.error('错误对象：', err)
    console.error('错误消息：', err.message)
    console.error('错误堆栈：', err.stack)
  }
}
```

## 常见错误码

| 错误码 | 含义 | 解决方案 |
|--------|------|----------|
| -1 | 系统错误 | 检查云函数是否部署 |
| -501001 | 数据库请求失败 | 检查数据库权限 |
| -502001 | 云函数不存在 | 重新部署云函数 |
| -502002 | 云函数执行失败 | 查看云函数日志 |
| -502003 | 云函数超时 | 优化云函数代码或增加超时时间 |

## 快速测试方案

如果云数据库暂时无法使用，可以临时使用本地数据测试分页功能：

在 `pages/index/index.js` 中，修改 `loadArticlesFromCloud` 方法，添加降级逻辑：

```javascript
async loadArticlesFromCloud(isRefresh = false) {
  // 测试模式：直接使用本地数据模拟分页
  const USE_LOCAL_TEST = true; // 设置为 true 启用测试模式
  
  if (USE_LOCAL_TEST) {
    return this.loadArticlesFromCloudMock(isRefresh);
  }
  
  // ... 原有云函数调用代码 ...
}

// 模拟云函数返回（用于测试）
loadArticlesFromCloudMock(isRefresh = false) {
  if (this.data.isLoading) return;
  
  if (isRefresh) {
    this.setData({
      currentPage: 1,
      articles: [],
      hasMore: true
    });
  }
  
  if (!this.data.hasMore && !isRefresh) return;
  
  this.setData({ isLoading: true });
  
  // 模拟网络延迟
  setTimeout(() => {
    const { currentPage, pageSize, allArticles } = this.data;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = allArticles.slice(start, end);
    
    const formattedArticles = pageData.map(article => ({
      ...article,
      time: formatRelativeTime(article.timestamp),
      viewsText: formatViews(article.views)
    }));
    
    const newArticles = isRefresh ? formattedArticles : this.data.articles.concat(formattedArticles);
    
    this.setData({
      articles: newArticles,
      totalCount: allArticles.length,
      hasMore: end < allArticles.length,
      currentPage: currentPage + 1,
      isLoading: false
    });
    
    console.log(`模拟加载成功：当前${newArticles.length}篇，共${allArticles.length}篇`);
  }, 500);
}
```

## 联系支持

如果以上方法都无法解决问题，请提供以下信息：
1. 控制台完整错误信息
2. 云函数日志截图
3. 数据库权限配置截图
4. 微信开发者工具版本号
