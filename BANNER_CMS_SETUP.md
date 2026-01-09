# 轮播图 CMS 配置指南

## 🎯 目标

使用 CloudBase CMS 管理小程序首页轮播图，支持：
- 可视化上传图片到云存储
- 设置标题、描述、跳转链接
- 控制显示顺序和启用状态

---

## 📋 步骤 1：创建 banners 内容模型

### 1.1 进入 CMS 管理后台

1. 打开微信开发者工具
2. 点击**云开发** → **CloudBase CMS**
3. 登录 CMS 后台
4. 点击**内容模型** → **创建内容模型**

---

### 1.2 配置内容模型

**基本信息：**
```
内容模型名称：banners
内容模型 ID：banners
显示名称：轮播图
描述：首页轮播图管理
```

---

### 1.3 添加字段

#### 字段 1：title（标题）
```
字段名：title
显示名称：标题
字段类型：单行文本
是否必填：是
说明：轮播图标题，如"防范电信诈骗"
```

#### 字段 2：desc（描述）
```
字段名：desc
显示名称：描述
字段类型：单行文本
是否必填：否
说明：轮播图副标题，如"守护你的钱包安全"
```

#### 字段 3：image（图片）⭐ 关键！
```
字段名：image
显示名称：图片
字段类型：图片
是否必填：是
说明：轮播图背景图片（建议尺寸：750x400px）
```

**重要：**
- CMS 会自动将图片上传到云存储
- 自动生成 `fileID`（云存储路径）
- 无需手动上传！

#### 字段 4：link（跳转链接）
```
字段名：link
显示名称：跳转链接
字段类型：单行文本
是否必填：否
说明：点击轮播图跳转的链接，例如：
  - /pages/article-detail/article-detail?id=123（文章详情）
  - 留空则不跳转
```

#### 字段 5：sort（排序）
```
字段名：sort
显示名称：排序
字段类型：数字
是否必填：是
默认值：0
说明：数字越小越靠前，如：1, 2, 3
```

#### 字段 6：status（状态）
```
字段名：status
显示名称：状态
字段类型：布尔值
是否必填：是
默认值：true
说明：
  - true：启用，在小程序中显示
  - false：禁用，不显示
```

---

## 📝 步骤 2：添加轮播图内容

### 2.1 创建第一个轮播图

1. 点击 **banners** → **新建内容**
2. 填写字段：
   ```
   标题：防范电信诈骗
   描述：守护你的钱包安全
   图片：点击上传按钮，选择图片（建议 750x400px）
   跳转链接：（留空或填写 /pages/article-detail/article-detail?id=1）
   排序：1
   状态：启用（勾选）
   ```
3. 点击**保存**

### 2.2 创建更多轮播图

重复上述步骤，创建 3-5 个轮播图：

**示例 1：**
```
标题：识别网络骗局
描述：提高防范意识
图片：上传图片
排序：2
状态：启用
```

**示例 2：**
```
标题：学习防骗知识
描述：远离诈骗陷阱
图片：上传图片
排序：3
状态：启用
```

---

## 🎨 图片设计建议

### 推荐尺寸
```
宽度：750px（rpx）
高度：400px（rpx）
比例：约 1.875:1
格式：JPG 或 PNG
大小：< 500KB
```

### 设计工具推荐
- **在线工具：** Canva、稿定设计
- **专业工具：** Figma、Photoshop
- **AI 生成：** Midjourney、DALL-E

### 设计要点
1. **背景：** 使用渐变色或纯色背景
2. **文字：** 大标题 + 小描述
3. **图标：** 可选，增加视觉效果
4. **对比度：** 确保文字清晰可读

---

## 💻 步骤 3：修改前端代码

### 3.1 修改 index.js

在 `pages/index/index.js` 中：

```javascript
Page({
  data: {
    banners: [],  // 从云端加载
    // ... 其他数据
  },

  onLoad() {
    this.loadBanners()  // 加载轮播图
    this.loadArticles()
    this.loadArticlesFromStorage()
  },

  // 新增：加载轮播图
  async loadBanners() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('banners')
        .where({
          status: true  // 只显示启用的轮播图
        })
        .orderBy('sort', 'asc')  // 按排序升序
        .get()

      console.log('加载轮播图：', res.data.length)
      
      if (res.data.length > 0) {
        this.setData({
          banners: res.data
        })
      }
    } catch (err) {
      console.error('加载轮播图失败：', err)
      // 失败时使用默认轮播图
    }
  }
})
```

---

### 3.2 修改 index.wxml

在 `pages/index/index.wxml` 中：

```xml
<!-- 轮播图 -->
<view class="banner-slider">
  <swiper 
    class="slider-container" 
    indicator-dots 
    indicator-color="rgba(255,255,255,0.5)"
    indicator-active-color="#ffffff"
    autoplay 
    interval="3000" 
    circular
  >
    <swiper-item wx:for="{{banners}}" wx:key="_id" bindtap="onBannerTap" data-link="{{item.link}}">
      <view class="slide-content">
        <!-- 使用云存储图片作为背景 -->
        <image class="slide-bg" src="{{item.image}}" mode="aspectFill"></image>
        
        <!-- 半透明遮罩（可选） -->
        <view class="slide-overlay"></view>
        
        <!-- 文字内容 -->
        <view class="slide-text">
          <view class="slide-title">{{item.title}}</view>
          <view class="slide-desc" wx:if="{{item.desc}}">{{item.desc}}</view>
        </view>
      </view>
    </swiper-item>
  </swiper>
</view>
```

**新增点击事件：**
```javascript
// 在 index.js 中添加
onBannerTap(e) {
  const link = e.currentTarget.dataset.link
  if (link) {
    wx.navigateTo({ url: link })
  }
}
```

---

### 3.3 修改 index.wxss

在 `pages/index/index.wxss` 中：

```css
/* 轮播图容器 */
.banner-slider {
  margin: 20rpx 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.slider-container {
  height: 400rpx;
}

/* 轮播图内容 */
.slide-content {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 背景图片 */
.slide-bg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

/* 半透明遮罩（可选，让文字更清晰） */
.slide-overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
  z-index: 2;
}

/* 文字内容 */
.slide-text {
  position: absolute;
  bottom: 60rpx;
  left: 40rpx;
  z-index: 3;
}

.slide-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.3);
  margin-bottom: 10rpx;
}

.slide-desc {
  font-size: 26rpx;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.3);
}
```

---

## 🗄️ 步骤 4：设置数据库权限

1. 打开**云开发控制台**
2. 进入**数据库** → **banners**
3. 点击**权限设置**
4. 选择：**所有用户可读，仅创建者可写**

或自定义规则：
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

---

## ✅ 完成！测试流程

### 1. 在 CMS 中上传轮播图
- 添加 3 张轮播图
- 设置标题、描述
- 上传图片（自动存储到云存储）

### 2. 重新编译小程序
- 进入首页
- 查看轮播图是否显示
- 测试自动轮播
- 测试点击跳转（如果配置了 link）

### 3. 验证功能
- ✅ 图片正常显示
- ✅ 自动轮播
- ✅ 点击跳转
- ✅ CMS 中添加新轮播图后实时生效

---

## 🎯 CMS 管理优势

### 管理员可以：
1. **上传图片：** 可视化上传，自动存储到云存储
2. **编辑内容：** 随时修改标题、描述
3. **调整顺序：** 修改 sort 值
4. **启用/禁用：** 切换 status 开关
5. **查看效果：** 无需重新编译小程序

### 前端自动：
- 每次打开小程序自动加载最新轮播图
- 无需手动更新代码
- 图片从云存储加载，速度快

---

## 📊 数据结构示例

### CMS 中的数据：
```json
{
  "_id": "banner001",
  "title": "防范电信诈骗",
  "desc": "守护你的钱包安全",
  "image": "cloud://cloud1-xxx.636c-cloud1-xxx/banners/banner1.jpg",
  "link": "/pages/article-detail/article-detail?id=123",
  "sort": 1,
  "status": true,
  "_createTime": "2026-01-09 10:00:00",
  "_updateTime": "2026-01-09 10:00:00"
}
```

### 前端接收的数据：
```javascript
banners: [
  {
    _id: "banner001",
    title: "防范电信诈骗",
    desc: "守护你的钱包安全",
    image: "cloud://cloud1-xxx.636c-cloud1-xxx/banners/banner1.jpg",
    link: "/pages/article-detail/article-detail?id=123",
    sort: 1,
    status: true
  },
  // ... 更多轮播图
]
```

---

## 🛠️ 常见问题

### Q1：图片上传后显示不出来？
**A：** 检查云存储权限：
1. 云开发控制台 → 云存储
2. 点击文件夹 → 权限设置
3. 设置为**所有用户可读**

### Q2：想要更换图片怎么办？
**A：** 在 CMS 中：
1. 点击对应轮播图
2. 点击图片字段的**重新上传**
3. 选择新图片
4. 保存

旧图片会自动删除。

### Q3：如何临时隐藏某个轮播图？
**A：** 在 CMS 中：
1. 编辑对应轮播图
2. 将 **status** 设为 false（取消勾选）
3. 保存

小程序中立即生效。

### Q4：轮播图顺序如何调整？
**A：** 修改 **sort** 值：
- 值越小越靠前
- 例如：1, 2, 3, 4

---

## 🚀 下一步

完成 CMS 配置后，我将为你修改前端代码！

告诉我你选择**方案 A（CMS）** 还是**方案 B（手动）**？
