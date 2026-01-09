// pages/user/user.js
Page({
  data: {
    userInfo: {
      nickName: '',
      avatarUrl: ''
    },
    signDays: 0,
    points: 0,
    achievements: 0,
    todaySigned: false
  },

  onLoad(options) {
    // 自动登录
    this.autoLogin()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadUserData()
  },
  
  // 自动登录（静默登录）
  async autoLogin() {
    try {
      // 调用云函数获取用户信息
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {}
      })
      
      if (result.result.success) {
        const data = result.result.data
        
        // 保存云端的签到日期到本地（关键修复！）
        if (data.userInfo.lastSignDate) {
          wx.setStorageSync('lastSignDate', data.userInfo.lastSignDate)
          console.log('从云端同步签到日期:', data.userInfo.lastSignDate)
        }
        
        // 检查今天是否已签到
        const todaySigned = this.checkTodaySigned()
        
        this.setData({ 
          userInfo: data.userInfo,
          signDays: data.userInfo.signDays || 0,
          points: data.userInfo.points || 0,
          achievements: data.userInfo.achievements?.length || 0,
          todaySigned: todaySigned
        })
        
        // 保存到本地
        wx.setStorageSync('userInfo', data.userInfo)
        wx.setStorageSync('openid', data.openid)
        wx.setStorageSync('signDays', data.userInfo.signDays || 0)
        wx.setStorageSync('points', data.userInfo.points || 0)
        
        console.log('自动登录成功，签到状态:', todaySigned ? '已签到' : '未签到')
      }
    } catch (err) {
      console.error('自动登录失败：', err)
    }
  },

  // 加载用户数据
  loadUserData() {
    // 从本地缓存获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || {}
    const signDays = wx.getStorageSync('signDays') || 0
    const points = wx.getStorageSync('points') || 0
    const achievements = wx.getStorageSync('achievements') || 0
    const todaySigned = this.checkTodaySigned()

    this.setData({
      userInfo,
      signDays,
      points,
      achievements,
      todaySigned
    })
  },

  // 检查今天是否已签到
  checkTodaySigned() {
    const lastSignDate = wx.getStorageSync('lastSignDate') || ''
    // 使用 YYYY-MM-DD 格式，与云函数保持一致
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    console.log('检查签到状态 - 上次签到:', lastSignDate, '今天:', today)
    return lastSignDate === today
  },

  // 选择头像
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    console.log('选择头像：', avatarUrl)
    
    wx.showLoading({ title: '更新中...' })
    
    try {
      // 上传头像到云存储
      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl
      })
      
      const cloudAvatarUrl = uploadResult.fileID
      
      // 更新用户信息
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          nickName: this.data.userInfo.nickName || '反诈用户',
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
  
  // 昵称输入
  async onNicknameChange(e) {
    const nickName = e.detail.value.trim()
    if (!nickName) return
    
    console.log('输入昵称：', nickName)
    
    wx.showLoading({ title: '更新中...' })
    
    try {
      // 更新用户信息
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          nickName,
          avatarUrl: this.data.userInfo.avatarUrl || ''
        }
      })
      
      if (result.result.success) {
        this.setData({
          'userInfo.nickName': nickName
        })
        wx.setStorageSync('userInfo', this.data.userInfo)
        wx.showToast({
          title: '昵称更新成功',
          icon: 'success'
        })
      }
    } catch (err) {
      console.error('更新昵称失败：', err)
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 处理签到
  async handleSignIn() {
    if (this.data.todaySigned) {
      wx.showToast({
        title: '今天已签到',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '签到中...' })
    
    try {
      // 调用云函数签到
      const result = await wx.cloud.callFunction({
        name: 'userSignIn',
        data: {}
      })
      
      wx.hideLoading()
      
      if (result.result.success) {
        const data = result.result.data
        
        this.setData({
          signDays: data.signDays,
          points: data.points,
          todaySigned: true
        })
        
        // 保存到本地缓存（使用云函数返回的日期，确保一致性）
        wx.setStorageSync('signDays', data.signDays)
        wx.setStorageSync('points', data.points)
        wx.setStorageSync('lastSignDate', data.lastSignDate)
        
        console.log('签到成功，保存日期:', data.lastSignDate)
        
        wx.showModal({
          title: '签到成功 ✨',
          content: result.result.message || `恭喜你！连续签到${data.signDays}天，获得${data.earnedPoints}积分！`,
          showCancel: false,
          confirmText: '太棒了'
        })
      } else {
        wx.showToast({
          title: result.result.errMsg || '签到失败',
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

  // 页面跳转
  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
    // TODO: 实现页面跳转
    // wx.navigateTo({ url })
  }
})

