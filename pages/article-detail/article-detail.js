// pages/article-detail/article-detail.js
Page({
  data: {
    article: {
      id: 1,
      title: '',
      tag: '',
      tagType: '',
      time: '',
      views: '',
      likes: 0,
      content: ''
    },
    relatedArticles: [],
    liked: false,
    collected: false
  },

  onLoad(options) {
    const id = options.id || 1
    this.loadArticle(id)
    this.loadRelatedArticles()
  },

  // 加载文章详情
  async loadArticle(id) {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const cloudResult = await wx.cloud.callFunction({
        name: 'getArticleDetail',
        data: { articleId: id }
      })
      
      if (cloudResult.result && cloudResult.result.success) {
        const data = cloudResult.result.data || {}
        const articleData = data.article || {}
        const viewCount = articleData.views ?? articleData.viewCount ?? 0
        const article = {
          id: articleData._id || id,
          tag: articleData.tag || '知识科普',
          tagType: articleData.tagType || 'info',
          title: articleData.title,
          time: this.formatTime(articleData.timestamp),
          views: this.formatViews(viewCount),
          likes: articleData.likes || 0,
          content: articleData.content || '',
          coverImage: articleData.coverImage || '',
          author: articleData.author || '反诈小助手'
        }
        
        this.setData({ article })
        
        if (Array.isArray(data.relatedArticles) && data.relatedArticles.length > 0) {
          const relatedArticles = data.relatedArticles.map(item => ({
            id: item._id,
            title: item.title,
            time: this.formatTime(item.timestamp),
            views: this.formatViews(item.views ?? item.viewCount ?? 0)
          }))
          this.setData({ relatedArticles })
        }
        
        this.syncActionData(data.actionData, 'readArticles')
        wx.hideLoading()
        
        // 检查点赞、收藏状态
        this.checkLikeStatus(id)
        this.checkCollectStatus(id)
        
        return
      }
    } catch (err) {
      console.error('从云函数加载失败：', err)
    }

    try {
      // 先尝试从云数据库加载
      const db = wx.cloud.database()
      const result = await db.collection('articles').doc(id).get()
      
      if (result.data) {
        console.log('从云数据库加载文章成功')
        const article = {
          id: result.data._id,
          tag: result.data.tag || '知识科普',
          tagType: result.data.tagType || 'info',
          title: result.data.title,
          time: this.formatTime(result.data.timestamp),
          views: this.formatViews(result.data.views || result.data.viewCount || 0),
          likes: result.data.likes || 0,
          content: result.data.content || '',
          coverImage: result.data.coverImage || '',
          author: result.data.author || '反诈小助手'
        }
        
        this.setData({ article })
        wx.hideLoading()
        
        // 增加浏览量
        this.incrementViews(id)
        
        // 检查点赞、收藏状态
        this.checkLikeStatus(id)
        this.checkCollectStatus(id)
        
        return
      }
    } catch (err) {
      console.error('从云数据库加载失败：', err)
    }
    
    // 云数据库加载失败，使用本地备份数据
    console.log('使用本地备份数据')
    wx.hideLoading()
    this.loadMockArticle(id)
  },
  
  // 加载本地备份文章（云数据库失败时使用）
  loadMockArticle(id) {
    // 模拟文章数据
    const mockArticles = {
      '1': {
        id: 1,
        tag: '紧急预警',
        tagType: 'danger',
        title: '警惕！"刷单兼职"骗局又出新花样，多名学生被骗',
        time: '2026-01-07 10:30',
        views: '12.3k',
        likes: 328,
        content: `
          <p style="margin-bottom: 20rpx;">近期，多名大学生在网上寻找兼职时遭遇"刷单诈骗"，损失金额从几百元到数万元不等。警方提醒广大学生，要警惕此类骗局。</p>
          
          <h3 style="font-size: 32rpx; font-weight: 700; margin: 30rpx 0 20rpx;">诈骗手法揭秘</h3>
          <p style="margin-bottom: 15rpx;">1. <strong>第一步：发布高薪招聘</strong><br/>骗子在各大社交平台、求职网站发布"日赚300-500"、"在家就能做"等诱人的兼职信息。</p>
          
          <p style="margin-bottom: 15rpx;">2. <strong>第二步：小额返利建立信任</strong><br/>最初会让你完成几单小额任务，并及时返还本金和佣金，让你觉得可靠。</p>
          
          <p style="margin-bottom: 15rpx;">3. <strong>第三步：诱导大额投入</strong><br/>等你放松警惕后，骗子会以"高额返利"、"完成任务组"等理由，要求你垫付大额资金。</p>
          
          <p style="margin-bottom: 15rpx;">4. <strong>第四步：失联跑路</strong><br/>当你投入大量资金后，骗子会以各种理由拖延返款，最终直接失联。</p>
          
          <h3 style="font-size: 32rpx; font-weight: 700; margin: 30rpx 0 20rpx;">如何识别刷单骗局</h3>
          <p style="margin-bottom: 10rpx;">✓ 正规企业不会让员工垫付资金</p>
          <p style="margin-bottom: 10rpx;">✓ "日入上千"、"躺着赚钱"都是骗局</p>
          <p style="margin-bottom: 10rpx;">✓ 要求下载陌生APP或跳转外部链接</p>
          <p style="margin-bottom: 10rpx;">✓ 用虚拟货币、游戏充值卡等支付</p>
          
          <h3 style="font-size: 32rpx; font-weight: 700; margin: 30rpx 0 20rpx;">防范建议</h3>
          <p style="margin-bottom: 10rpx;">🛡️ 通过正规渠道寻找兼职</p>
          <p style="margin-bottom: 10rpx;">🛡️ 不要相信"轻松高薪"的承诺</p>
          <p style="margin-bottom: 10rpx;">🛡️ 绝不垫付任何资金</p>
          <p style="margin-bottom: 10rpx;">🛡️ 遇到可疑情况及时报警</p>
          
          <p style="margin-top: 30rpx; padding: 20rpx; background: #fee2e2; border-radius: 10rpx; color: #dc2626;">
            <strong>⚠️ 紧急提醒：</strong>如果您已经被骗，请立即拨打反诈专线 96110 或报警！
          </p>
        `
      },
      '2': {
        id: 2,
        tag: '案例分析',
        tagType: 'warning',
        title: '大学生网购遇"退款诈骗"，一步步掉入陷阱',
        time: '2026-01-07 08:15',
        views: '8.7k',
        likes: 215,
        content: `
          <p style="margin-bottom: 20rpx;">大三学生小李在某电商平台购买了一件衣服，第二天接到"客服"电话，称商品有质量问题需要退款...</p>
          
          <h3 style="font-size: 32rpx; font-weight: 700; margin: 30rpx 0 20rpx;">案例回顾</h3>
          <p>小李在网购后接到"客服"电话，对方准确说出了她的订单信息，称商品甲醛超标需要退款。在"客服"的指导下，小李下载了一个"退款专用APP"，并按要求输入了银行卡信息和验证码，结果卡里的5000元被转走。</p>
          
          <h3 style="font-size: 32rpx; font-weight: 700; margin: 30rpx 0 20rpx;">诈骗手法分析</h3>
          <p style="margin-bottom: 10rpx;">1. 获取订单信息（可能是数据泄露）</p>
          <p style="margin-bottom: 10rpx;">2. 冒充官方客服取得信任</p>
          <p style="margin-bottom: 10rpx;">3. 制造紧迫感（商品有问题、账号被冻结等）</p>
          <p style="margin-bottom: 10rpx;">4. 诱导下载钓鱼APP或跳转钓鱼网站</p>
          <p style="margin-bottom: 10rpx;">5. 骗取银行卡信息和验证码</p>
          
          <h3 style="font-size: 32rpx; font-weight: 700; margin: 30rpx 0 20rpx;">防骗要点</h3>
          <p style="margin-bottom: 10rpx;">✓ 正规退款在原平台操作，不需要额外下载APP</p>
          <p style="margin-bottom: 10rpx;">✓ 不要点击陌生链接</p>
          <p style="margin-bottom: 10rpx;">✓ 不要向任何人透露验证码</p>
          <p style="margin-bottom: 10rpx;">✓ 接到可疑电话，挂断后通过官方渠道核实</p>
        `
      }
    }

    const article = mockArticles[id] || mockArticles['1']
    this.setData({ article })

    // 检查是否已点赞、收藏
    this.checkLikeStatus(id)
    this.checkCollectStatus(id)
  },
  
  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },
  
  // 格式化浏览量
  formatViews(views) {
    if (views >= 10000) {
      return `${(views / 10000).toFixed(1)}w`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`
    } else {
      return views.toString()
    }
  },
  
  // 增加浏览量（同步到云数据库）
  async incrementViews(articleId) {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      
      await db.collection('articles').doc(articleId).update({
        data: {
          views: _.inc(1)  // 浏览量 +1
        }
      })
      
      console.log('浏览量已更新')
    } catch (err) {
      console.error('更新浏览量失败：', err)
    }
  },

  syncActionData(actionData, countKey) {
    if (!actionData) return

    if (typeof actionData.updatedCount === 'number') {
      wx.setStorageSync(countKey, actionData.updatedCount)
    }
    if (typeof actionData.userPoints === 'number') {
      wx.setStorageSync('points', actionData.userPoints)
    } else if (actionData.totalPoints) {
      const points = wx.getStorageSync('points') || 0
      wx.setStorageSync('points', points + actionData.totalPoints)
    }
    if (Array.isArray(actionData.newAchievements) && actionData.newAchievements.length > 0) {
      const achievementIds = actionData.newAchievements
        .map(item => item.achievementId)
        .filter(Boolean)
      const userInfo = wx.getStorageSync('userInfo') || {}
      
      if (Array.isArray(userInfo.achievements) && achievementIds.length > 0) {
        const merged = Array.from(new Set([...userInfo.achievements, ...achievementIds]))
        userInfo.achievements = merged
        wx.setStorageSync('userInfo', userInfo)
        wx.setStorageSync('achievements', merged.length)
      } else {
        const achievements = wx.getStorageSync('achievements') || 0
        wx.setStorageSync('achievements', achievements + actionData.newAchievements.length)
      }
    }
  },
  
  // 加载相关文章
  loadRelatedArticles() {
    const related = [
      {
        id: 3,
        title: '校园贷、培训贷...大学生必知的5种贷款陷阱',
        time: '昨天 18:30',
        views: '15.2k'
      },
      {
        id: 4,
        title: '大学生求职防骗指南：识破"高薪兼职"套路',
        time: '今天 10:15',
        views: '6.5k'
      }
    ]
    this.setData({ relatedArticles: related })
  },

  // 检查点赞状态
  checkLikeStatus(id) {
    const liked = wx.getStorageSync(`liked_${id}`) || false
    this.setData({ liked })
  },

  // 检查收藏状态
  checkCollectStatus(id) {
    const collected = wx.getStorageSync(`collected_${id}`) || false
    this.setData({ collected })
  },

  // 点赞
  handleLike() {
    const liked = !this.data.liked
    const article = this.data.article
    
    this.setData({ 
      liked,
      'article.likes': article.likes + (liked ? 1 : -1)
    })
    
    wx.setStorageSync(`liked_${article.id}`, liked)
    
    wx.showToast({
      title: liked ? '已点赞' : '已取消',
      icon: 'success'
    })
  },

  // 收藏
  handleCollect() {
    const collected = !this.data.collected
    const article = this.data.article
    
    this.setData({ collected })
    wx.setStorageSync(`collected_${article.id}`, collected)
    
    wx.showToast({
      title: collected ? '已收藏' : '已取消',
      icon: 'success'
    })
  },

  // 查看相关文章
  viewArticle(e) {
    const id = e.currentTarget.dataset.id
    wx.redirectTo({
      url: `/pages/article-detail/article-detail?id=${id}`
    })
  },

  // 分享
  onShareAppMessage() {
    const article = this.data.article
    return {
      title: article.title,
      path: `/pages/article-detail/article-detail?id=${article.id}`
    }
  }
})

