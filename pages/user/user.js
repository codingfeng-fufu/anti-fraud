/**
 * 用户管理页面 - 个人中心模块
 * 
 * 上游依赖：云函数(login, userSignIn)，全局app.js配置
 * 入口：页面onLoad生命周期，通过autoLogin自动登录
 * 主要功能：用户信息展示与编辑、签到功能、积分和成就统计、页面导航
 * 输出：用户数据更新到本地缓存和云端，签到记录更新
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */
// pages/user/user.js
Page({
  data: {
    userInfo: {
      nickName: '',
      avatarUrl: ''
    },
    signDays: 0,
    signDates: [],
    points: 0,
    achievements: 0,
    todaySigned: false,
    equippedTitles: [],
    allTitles: []
  },

  onLoad(options) {
    this.autoLogin()
  },

  onShow() {
    this.loadUserDataFromCloud()
    this.loadUserTitles()
  },

  onHide() {
    this.saveToLocal()
  },

  onUnload() {
    this.saveToLocal()
  },

  saveToLocal() {
    wx.setStorageSync('signDays', this.data.signDays)
    wx.setStorageSync('signDates', this.data.signDates)
    wx.setStorageSync('points', this.data.points)
    wx.setStorageSync('achievements', this.data.achievements)
    if (this.data.signDates.length > 0) {
      wx.setStorageSync('lastSignDate', this.data.signDates[this.data.signDates.length - 1])
    }
  },
  
  async autoLogin() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {}
      })
      
      if (result.result.success) {
        const data = result.result.data
        const signDates = data.userInfo.signDates || []
        const signDays = this.calculateConsecutiveDays(signDates)
        
        if (signDates.length > 0) {
          wx.setStorageSync('signDates', signDates)
          wx.setStorageSync('lastSignDate', signDates[signDates.length - 1])
        }
        
        const todaySigned = this.checkTodaySigned(signDates)
        
        this.setData({ 
          userInfo: data.userInfo,
          signDays,
          signDates,
          points: data.userInfo.points || 0,
          achievements: data.userInfo.achievements?.length || 0,
          todaySigned: todaySigned
        })
        
        wx.setStorageSync('userInfo', data.userInfo)
        wx.setStorageSync('openid', data.openid)
        wx.setStorageSync('signDays', signDays)
        wx.setStorageSync('points', data.userInfo.points || 0)
        wx.setStorageSync('achievements', data.userInfo.achievements?.length || 0)
      }
    } catch (err) {
      console.error('自动登录失败：', err)
    }
  },

  async loadUserDataFromCloud() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })
      
      if (result.result.success) {
        const data = result.result.data
        const signDates = data.userInfo.signDates || []
        const signDays = this.calculateConsecutiveDays(signDates)
        
        if (signDates.length > 0) {
          wx.setStorageSync('signDates', signDates)
          wx.setStorageSync('lastSignDate', signDates[signDates.length - 1])
        }
        
        const todaySigned = this.checkTodaySigned(signDates)
        
        this.setData({ 
          userInfo: data.userInfo,
          signDays,
          signDates,
          points: data.userInfo.points || 0,
          achievements: data.userInfo.achievements?.length || 0,
          todaySigned: todaySigned
        })
        
        wx.setStorageSync('userInfo', data.userInfo)
        wx.setStorageSync('openid', data.openid)
        wx.setStorageSync('signDays', signDays)
        wx.setStorageSync('points', data.userInfo.points || 0)
        wx.setStorageSync('achievements', data.userInfo.achievements?.length || 0)
      }
    } catch (err) {
      console.error('从云端加载用户数据失败：', err)
      this.loadUserData()
    }
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const signDates = wx.getStorageSync('signDates') || []
    const signDays = this.calculateConsecutiveDays(signDates)
    const points = wx.getStorageSync('points') || 0
    const achievements = userInfo.achievements
      ? userInfo.achievements.length
      : (wx.getStorageSync('achievements') || 0)
    const todaySigned = this.checkTodaySigned(signDates)

    this.setData({
      userInfo,
      signDays,
      signDates,
      points,
      achievements,
      todaySigned
    })
  },

  calculateConsecutiveDays(signDates) {
    if (!signDates || signDates.length === 0) return 0
    
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const today = beijingTime.toISOString().split('T')[0]
    const sortedDates = [...signDates].sort()
    
    if (!sortedDates.includes(today)) {
      const yesterdayDate = new Date(beijingTime.getTime() - 24 * 60 * 60 * 1000)
      const yesterday = yesterdayDate.toISOString().split('T')[0]
      if (!sortedDates.includes(yesterday)) {
        return 0
      }
    }
    
    let consecutiveDays = 0
    let checkDate = beijingTime
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (sortedDates.includes(dateStr)) {
        consecutiveDays++
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      } else {
        break
      }
    }
    
    return consecutiveDays
  },

  checkTodaySigned(signDates) {
    const dates = signDates || this.data.signDates || wx.getStorageSync('signDates') || []
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const today = beijingTime.toISOString().split('T')[0]
    return dates.includes(today)
  },

  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    
    wx.showLoading({ title: '更新中...' })
    
    try {
      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl
      })
      
      const cloudAvatarUrl = uploadResult.fileID
      
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          nickName: this.data.userInfo.nickName,
          avatarUrl: cloudAvatarUrl
        }
      })
      
      if (result.result.success) {
        this.setData({
          'userInfo.avatarUrl': cloudAvatarUrl
        })
        wx.setStorageSync('userInfo', this.data.userInfo)
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        })
      }
    } catch (err) {
      console.error('更新头像失败：', err)
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async handleSignIn() {
    const todaySigned = this.checkTodaySigned()
    
    if (todaySigned) {
      this.setData({ todaySigned: true })
      wx.showToast({
        title: '今天已签到',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '签到中...' })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'userSignIn',
        data: {}
      })
      
      wx.hideLoading()
      
      if (result.result.success) {
        const data = result.result.data
        
        this.setData({
          signDays: data.signDays,
          signDates: data.signDates,
          points: data.points,
          todaySigned: true
        })
        
        wx.setStorageSync('signDays', data.signDays)
        wx.setStorageSync('signDates', data.signDates)
        wx.setStorageSync('points', data.points)
        if (data.lastSignDate) {
          wx.setStorageSync('lastSignDate', data.lastSignDate)
        }
        
        wx.showModal({
          title: '签到成功 ✨',
          content: result.result.message || `恭喜你！连续签到${data.signDays}天，获得${data.earnedPoints}积分！`,
          showCancel: false,
          confirmText: '太棒了'
        })
      } else {
        const errMsg = result.result.errMsg || '签到失败'
        
        if (errMsg.includes('已经签到') || errMsg.includes('已签到')) {
          this.autoLogin()
        }
        
        wx.showToast({
          title: errMsg,
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('签到失败：', err)
      wx.showToast({
        title: '签到失败，请重试',
        icon: 'none'
      })
    }
  },

  openMyProfile() {
    if (!this.data.userInfo.nickName) {
      wx.showToast({
        title: '请先设置昵称',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/my/my'
    })
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    
    wx.navigateTo({ url })
  },

  async loadUserTitles() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserTitles',
        data: {}
      })

      if (result.result.success) {
        this.setData({
          equippedTitles: result.result.data.equippedTitles || [],
          allTitles: result.result.data.allTitles || []
        })
      }
    } catch (err) {
      console.error('加载用户称号失败：', err)
    }
  },

  showTitleManagement() {
    wx.navigateTo({
      url: '/pages/title-management/title-management'
    })
  }
})

