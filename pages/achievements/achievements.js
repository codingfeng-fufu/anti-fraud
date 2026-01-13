// pages/achievements/achievements.js
Page({
  data: {
    // 用户数据
    totalPoints: 0,
    signDays: 0,
    readArticles: 0,
    chatTimes: 0,
    
    // 成就列表
    achievements: [
      // 签到类成就
      {
        id: 'sign_1',
        title: '初来乍到',
        desc: '完成首次签到',
        icon: '🎯',
        points: 10,
        target: 1,
        current: 0,
        type: 'sign',
        unlocked: false
      },
      {
        id: 'sign_7',
        title: '坚持不懈',
        desc: '连续签到7天',
        icon: '📅',
        points: 50,
        target: 7,
        current: 0,
        type: 'sign',
        unlocked: false
      },
      {
        id: 'sign_30',
        title: '月度冠军',
        desc: '连续签到30天',
        icon: '🏆',
        points: 200,
        target: 30,
        current: 0,
        type: 'sign',
        unlocked: false
      },
      {
        id: 'sign_100',
        title: '坚如磐石',
        desc: '连续签到100天',
        icon: '💎',
        points: 1000,
        target: 100,
        current: 0,
        type: 'sign',
        unlocked: false
      },
      
      // 学习类成就
      {
        id: 'read_1',
        title: '求知若渴',
        desc: '阅读1篇反诈文章',
        icon: '📖',
        points: 10,
        target: 1,
        current: 0,
        type: 'read',
        unlocked: false
      },
      {
        id: 'read_10',
        title: '博览群书',
        desc: '阅读10篇反诈文章',
        icon: '📚',
        points: 100,
        target: 10,
        current: 0,
        type: 'read',
        unlocked: false
      },
      {
        id: 'read_50',
        title: '反诈达人',
        desc: '阅读50篇反诈文章',
        icon: '🎓',
        points: 500,
        target: 50,
        current: 0,
        type: 'read',
        unlocked: false
      },
      
      // AI对话类成就
      {
        id: 'chat_1',
        title: '初次对话',
        desc: '与AI助手对话1次',
        icon: '💬',
        points: 10,
        target: 1,
        current: 0,
        type: 'chat',
        unlocked: false
      },
      {
        id: 'chat_10',
        title: '积极提问',
        desc: '与AI助手对话10次',
        icon: '🗨️',
        points: 50,
        target: 10,
        current: 0,
        type: 'chat',
        unlocked: false
      },
      {
        id: 'chat_50',
        title: '防诈专家',
        desc: '与AI助手对话50次',
        icon: '🎖️',
        points: 200,
        target: 50,
        current: 0,
        type: 'chat',
        unlocked: false
      },
      
      // 积分类成就
      {
        id: 'points_100',
        title: '初级卫士',
        desc: '累计获得100积分',
        icon: '⭐',
        points: 0,
        target: 100,
        current: 0,
        type: 'points',
        unlocked: false
      },
      {
        id: 'points_500',
        title: '中级卫士',
        desc: '累计获得500积分',
        icon: '🌟',
        points: 0,
        target: 500,
        current: 0,
        type: 'points',
        unlocked: false
      },
      {
        id: 'points_1000',
        title: '高级卫士',
        desc: '累计获得1000积分',
        icon: '✨',
        points: 0,
        target: 1000,
        current: 0,
        type: 'points',
        unlocked: false
      }
    ],
    
    // 统计数据
    stats: {
      unlocked: 0,
      total: 0,
      progress: 0
    }
  },

  onLoad() {
    this.loadUserData()
    this.checkAchievements()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadUserData()
    this.checkAchievements()
  },

  // 加载用户数据
  loadUserData() {
    try {
      const signDays = wx.getStorageSync('signDays') || 0
      const points = wx.getStorageSync('points') || 0
      const readArticles = wx.getStorageSync('readArticles') || 0
      const chatTimes = wx.getStorageSync('chatTimes') || 0
      
      this.setData({
        signDays,
        totalPoints: points,
        readArticles,
        chatTimes
      })
    } catch (e) {
      console.error('加载用户数据失败：', e)
    }
  },

  // 检查成就解锁状态
  checkAchievements() {
    const { signDays, totalPoints, readArticles, chatTimes } = this.data
    let achievements = this.data.achievements.map(item => {
      let current = 0
      
      // 根据类型获取当前进度
      switch (item.type) {
        case 'sign':
          current = signDays
          break
        case 'read':
          current = readArticles
          break
        case 'chat':
          current = chatTimes
          break
        case 'points':
          current = totalPoints
          break
      }
      
      // 检查是否解锁
      const unlocked = current >= item.target
      
      // 如果刚解锁，显示提示
      if (unlocked && !item.unlocked) {
        this.showUnlockTip(item)
      }
      
      return {
        ...item,
        current,
        unlocked
      }
    })
    
    // 计算统计数据
    const unlocked = achievements.filter(item => item.unlocked).length
    const total = achievements.length
    const progress = Math.round((unlocked / total) * 100)
    
    this.setData({
      achievements,
      'stats.unlocked': unlocked,
      'stats.total': total,
      'stats.progress': progress
    })
  },

  // 显示解锁提示
  showUnlockTip(achievement) {
    wx.showToast({
      title: `🎉 解锁成就：${achievement.title}`,
      icon: 'none',
      duration: 2000
    })
  },

  // 切换成就类型筛选
  filterAchievements(e) {
    const type = e.currentTarget.dataset.type
    // TODO: 实现筛选功能
    console.log('筛选类型：', type)
  },

  // 分享成就
  shareAchievement(e) {
    const id = e.currentTarget.dataset.id
    const achievement = this.data.achievements.find(item => item.id === id)
    
    if (!achievement || !achievement.unlocked) {
      wx.showToast({
        title: '该成就尚未解锁',
        icon: 'none'
      })
      return
    }
    
    // TODO: 实现分享功能
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})
