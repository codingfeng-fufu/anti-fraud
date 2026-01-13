// pages/learning/learning.js
Page({
  data: {
    // 学习统计
    stats: {
      totalArticles: 0,
      totalTime: 0, // 分钟
      totalChats: 0,
      continuousDays: 0
    },
    
    // 阅读历史
    readHistory: [],
    
    // 当前tab
    currentTab: 'articles' // articles, chats
  },

  onLoad() {
    this.loadLearningData()
  },

  onShow() {
    this.loadLearningData()
  },

  // 加载学习数据
  loadLearningData() {
    try {
      // 加载阅读历史
      const readHistory = wx.getStorageSync('readHistory') || []
      
      // 加载AI对话记录 (从本地存储)
      const chatMessages = wx.getStorageSync('chat_messages') || []
      
      // 加载签到天数
      const signDays = wx.getStorageSync('signDays') || 0
      
      // 计算统计数据
      const totalArticles = readHistory.length
      const totalTime = readHistory.reduce((sum, item) => sum + (item.readTime || 0), 0)
      const totalChats = Math.floor(chatMessages.length / 2) // 用户消息数量
      
      this.setData({
        readHistory: readHistory.slice(0, 50), // 最多显示50条
        'stats.totalArticles': totalArticles,
        'stats.totalTime': totalTime,
        'stats.totalChats': totalChats,
        'stats.continuousDays': signDays
      })
    } catch (e) {
      console.error('加载学习数据失败：', e)
    }
  },

  // 切换tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      currentTab: tab
    })
  },

  // 跳转到文章详情
  viewArticle(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?id=${id}`
    })
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有学习记录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.setStorageSync('readHistory', [])
            this.setData({
              readHistory: [],
              'stats.totalArticles': 0,
              'stats.totalTime': 0
            })
            wx.showToast({
              title: '已清空记录',
              icon: 'success'
            })
          } catch (e) {
            console.error('清空失败：', e)
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})
