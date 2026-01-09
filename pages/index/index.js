// pages/index/index.js

// 工具函数：格式化时间为相对时间
function formatRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 2 * day) {
    return '昨天'
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

// 工具函数：格式化浏览量
function formatViews(views) {
  if (views >= 10000) {
    return `${(views / 10000).toFixed(1)}w`
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`
  } else {
    return views.toString()
  }
}

Page({
  data: {
    // 轮播图数据
    banners: [
      {
        id: 1,
        icon: '🛡️',
        title: '防范电信诈骗',
        desc: '守护你的钱包安全',
        bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      {
        id: 2,
        icon: '📱',
        title: '识别网络骗局',
        desc: '提高防范意识',
        bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      {
        id: 3,
        icon: '💡',
        title: '学习防骗知识',
        desc: '远离诈骗陷阱',
        bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      }
    ],
    
    // 分类数据（简化，只保留核心分类）
    categories: [
      '全部', '大学生', '刷单诈骗', '校园贷', '电信诈骗', 
      '网购退款', '杀猪盘', '投资理财'
    ],
    selectedCategory: '全部',
    
    // 所有文章数据（原始数据）
    allArticles: [
      {
        id: 1,
        tag: '紧急预警',
        tagType: 'danger',
        title: '警惕！"刷单兼职"骗局又出新花样，多名学生被骗',
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2小时前
        views: 12300,
        category: '刷单诈骗'
      },
      {
        id: 2,
        tag: '案例分析',
        tagType: 'warning',
        title: '大学生网购遇"退款诈骗"，一步步掉入陷阱',
        timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5小时前
        views: 8700,
        category: '网购退款'
      },
      {
        id: 3,
        tag: '防骗知识',
        tagType: 'warning',
        title: '校园贷、培训贷...大学生必知的5种贷款陷阱',
        timestamp: Date.now() - 30 * 60 * 60 * 1000, // 约昨天
        views: 15200,
        category: '校园贷'
      },
      {
        id: 4,
        tag: '知识科普',
        tagType: 'info',
        title: '大学生求职防骗指南：识破"高薪兼职"套路',
        timestamp: Date.now() - 10 * 60 * 60 * 1000, // 10小时前
        views: 6500,
        category: '大学生'
      },
      {
        id: 5,
        tag: '视频教程',
        tagType: 'info',
        title: '3分钟了解"杀猪盘"：大学生恋爱交友防骗攻略',
        timestamp: Date.now() - 12 * 60 * 60 * 1000, // 12小时前
        views: 9800,
        category: '杀猪盘'
      },
      {
        id: 6,
        tag: '紧急预警',
        tagType: 'danger',
        title: '新型电信诈骗：冒充公检法人员要求转账',
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1天前
        views: 18500,
        category: '电信诈骗'
      },
      {
        id: 7,
        tag: '案例分析',
        tagType: 'warning',
        title: '投资理财骗局揭秘：高收益背后的陷阱',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前
        views: 11200,
        category: '投资理财'
      },
      {
        id: 8,
        tag: '知识科普',
        tagType: 'info',
        title: '如何识别钓鱼邮件？这些特征要注意',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3天前
        views: 7800,
        category: '电信诈骗'
      },
      {
        id: 9,
        tag: '防骗知识',
        tagType: 'warning',
        title: '校园贷的"套路"有多深？真实案例告诉你',
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4天前
        views: 13600,
        category: '校园贷'
      },
      {
        id: 10,
        tag: '紧急预警',
        tagType: 'danger',
        title: '网购退款诈骗升级！这些话术要警惕',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5天前
        views: 10500,
        category: '网购退款'
      }
    ],
    
    // 显示的文章列表（会根据分类筛选）
    articles: [],
    
    hasMore: true
  },

  onLoad(options) {
    // 从本地存储加载文章数据（包含浏览量更新）
    this.loadArticlesFromStorage()
    
    // 格式化并显示所有文章
    this.updateArticlesList(this.data.allArticles)
  },
  
  onShow() {
    // 每次显示页面时更新时间显示（相对时间会变化）
    if (this.data.articles.length > 0) {
      const currentCategory = this.data.selectedCategory
      this.selectCategory({
        currentTarget: {
          dataset: { category: currentCategory }
        }
      })
    }
  },
  
  // 从本地存储加载文章数据
  loadArticlesFromStorage() {
    try {
      const savedArticles = wx.getStorageSync('articles_data')
      if (savedArticles && Array.isArray(savedArticles)) {
        // 合并保存的浏览量数据
        this.data.allArticles = this.data.allArticles.map(article => {
          const saved = savedArticles.find(a => a.id === article.id)
          if (saved && saved.views) {
            return { ...article, views: saved.views }
          }
          return article
        })
      }
    } catch (err) {
      console.error('加载文章数据失败：', err)
    }
  },
  
  // 保存文章数据到本地存储
  saveArticlesToStorage() {
    try {
      const articlesData = this.data.allArticles.map(article => ({
        id: article.id,
        views: article.views,
        timestamp: article.timestamp
      }))
      wx.setStorageSync('articles_data', articlesData)
    } catch (err) {
      console.error('保存文章数据失败：', err)
    }
  },
  
  // 更新文章列表（格式化时间和浏览量）
  updateArticlesList(articles) {
    const formattedArticles = articles.map(article => ({
      ...article,
      time: formatRelativeTime(article.timestamp),
      viewsText: formatViews(article.views)
    }))
    
    this.setData({
      articles: formattedArticles
    })
  },

  onPullDownRefresh() {
    // 下拉刷新
    setTimeout(() => {
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    
    // 筛选文章
    let filteredArticles = []
    if (category === '全部') {
      filteredArticles = this.data.allArticles
    } else {
      filteredArticles = this.data.allArticles.filter(article => 
        article.category === category || article.category === '大学生'
      )
    }
    
    this.setData({
      selectedCategory: category
    })
    
    // 格式化并更新列表
    this.updateArticlesList(filteredArticles)
    
    // 提示
    if (filteredArticles.length === 0) {
      wx.showToast({
        title: '暂无相关内容',
        icon: 'none'
      })
    }
  },

  // 搜索
  handleSearch(e) {
    const keyword = e.detail.value.trim()
    if (!keyword) {
      // 如果搜索为空，恢复当前分类的文章
      this.selectCategory({ 
        currentTarget: { 
          dataset: { category: this.data.selectedCategory } 
        } 
      })
      return
    }
    
    // 在所有文章中搜索（标题包含关键词）
    const searchResults = this.data.allArticles.filter(article => 
      article.title.toLowerCase().includes(keyword.toLowerCase()) ||
      article.tag.toLowerCase().includes(keyword.toLowerCase())
    )
    
    this.setData({
      selectedCategory: '全部'  // 搜索时重置分类
    })
    
    // 格式化并更新列表
    this.updateArticlesList(searchResults)
    
    if (searchResults.length === 0) {
      wx.showToast({
        title: '未找到相关内容',
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: `找到 ${searchResults.length} 条结果`,
        icon: 'success'
      })
    }
  },

  // 查看文章详情
  viewArticle(e) {
    const id = e.currentTarget.dataset.id
    
    // 增加浏览量
    this.incrementViews(id)
    
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?id=${id}`
    })
  },
  
  // 增加文章浏览量
  incrementViews(articleId) {
    // 更新 allArticles 中的浏览量
    this.data.allArticles = this.data.allArticles.map(article => {
      if (article.id === articleId) {
        return { ...article, views: article.views + 1 }
      }
      return article
    })
    
    // 更新显示列表中的浏览量
    const updatedArticles = this.data.articles.map(article => {
      if (article.id === articleId) {
        const newViews = article.views + 1
        return { 
          ...article, 
          views: newViews,
          viewsText: formatViews(newViews)
        }
      }
      return article
    })
    
    this.setData({
      articles: updatedArticles
    })
    
    // 保存到本地存储
    this.saveArticlesToStorage()
  }
})
