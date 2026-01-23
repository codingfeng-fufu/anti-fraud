/**
 * 成就页面 - 成就系统模块
 * 
 * 上游依赖：本地存储数据（积分、签到天数、阅读文章数、对话次数）
 * 入口：页面onLoad生命周期，通过loadUserData加载用户数据
 * 主要功能：成就列表展示、成就解锁状态检查、成就统计、分享功能
 * 输出：渲染成就列表界面，显示用户成就进度和解锁状态
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */
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
         unlocked: false,
         rewardTitleId: null
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
         unlocked: false,
         rewardTitleId: 'sign_7_title',  // 示例称号ID
         rewardTitleName: '七日勤勉'     // 示例称号名称
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
         unlocked: false,
         rewardTitleId: 'sign_30_title',  // 示例称号ID
         rewardTitleName: '签到大师'      // 示例称号名称
       },
       {
         id: 'sign_100',
         title: '百日传奇',
         desc: '连续签到100天',
         icon: '💎',
         points: 1000,
         target: 100,
         current: 0,
         type: 'sign',
         unlocked: false,
         rewardTitleId: 'sign_100_title',  // 示例称号ID
         rewardTitleName: '百日传奇'       // 示例称号名称
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
         unlocked: false,
         rewardTitleId: null
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
         unlocked: false,
         rewardTitleId: 'read_10_title',   // 示例称号ID
         rewardTitleName: '求知者'         // 示例称号名称
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
         unlocked: false,
         rewardTitleId: 'read_50_title',   // 示例称号ID
         rewardTitleName: '博学者'         // 示例称号名称
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
         unlocked: false,
         rewardTitleId: null
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
         unlocked: false,
         rewardTitleId: 'chat_expert_10',   // 对应称号ID
         rewardTitleName: '对话新手'        // 对应称号名称
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
         unlocked: false,
         rewardTitleId: 'chat_expert_50',   // 对应称号ID
         rewardTitleName: '对话达人'        // 对应称号名称
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
         unlocked: false,
         rewardTitleId: null
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
         unlocked: false,
         rewardTitleId: null
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
         unlocked: false,
         rewardTitleId: null
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
    console.log('成就页面onLoad触发')
    this.loadUserDataFromCloud()
    this.checkAchievements()
  },

  // 从云端加载用户数据
  async loadUserDataFromCloud() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })
      
      if (result.result.success) {
        const data = result.result.data.userInfo
        const signDays = data.signDays || 0
        const points = data.points || 0
        const readArticles = data.totalReadCount || 0
        const chatTimes = data.totalChatCount || 0
        
        console.log('从云端加载用户数据:', { signDays, points, readArticles, chatTimes })
        
        this.setData({
          signDays,
          totalPoints: points,
          readArticles,
          chatTimes
        })
        
        // 更新本地存储
        wx.setStorageSync('signDays', signDays)
        wx.setStorageSync('points', points)
        wx.setStorageSync('readArticles', readArticles)
        wx.setStorageSync('chatTimes', chatTimes)
      }
    } catch (err) {
      console.error('从云端加载用户数据失败：', err)
      // 降级到本地存储
      this.loadUserData()
    }
  },

onShow() {
    console.log('成就页面onShow触发')
    this.loadUserDataFromCloud()
    this.checkAchievements()
  },

  // 加载用户数据
loadUserData() {
    try {
      const signDays = wx.getStorageSync('signDays') || 0
      const points = wx.getStorageSync('points') || 0
      const readArticles = wx.getStorageSync('readArticles') || 0
      const chatTimes = wx.getStorageSync('chatTimes') || 0
      
      console.log('加载用户数据:', { signDays, points, readArticles, chatTimes })
      
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
    console.log('检查成就状态:', { signDays, totalPoints, readArticles, chatTimes })
    
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
      
      console.log(`成就 ${item.id}: 当前=${current}, 目标=${item.target}, 解锁=${unlocked}`)
      
      return {
        ...item,
        current,
        unlocked
      }
    })
    
    // 将已解锁的成就置顶
    achievements.sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1
      if (!a.unlocked && b.unlocked) return 1
      return 0
    })
    
    // 计算统计数据
    const unlocked = achievements.filter(item => item.unlocked).length
    const total = achievements.length
    const progress = Math.round((unlocked / total) * 100)
    
    console.log('成就统计:', { unlocked, total, progress })
    
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
