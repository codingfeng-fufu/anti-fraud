/**
 * 我的页面 - 用户个人资料模块
 * 
 * 上游依赖：云函数(getUserTitles)，本地缓存(userInfo, points, signDays)
 * 入口：页面onLoad/onShow生命周期
 * 主要功能：展示用户基本信息、成就数、称号列表、积分等数据
 * 输出：渲染用户个人资料界面并同步称号数据
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */
// pages/my/my.js
Page({
  data: {
    userInfo: {},
    signDays: 0,
    points: 0,
    achievements: 0,
    displayTitles: [],
    titleStats: {
      owned: 0,
      equipped: 0
    }
  },

  onLoad() {
    this.loadUserData()
    this.loadUserTitles()
  },

  onShow() {
    this.loadUserData()
    this.loadUserTitles()
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const signDays = wx.getStorageSync('signDays') || 0
    const points = wx.getStorageSync('points') || 0
    const achievements = userInfo.achievements
      ? userInfo.achievements.length
      : (wx.getStorageSync('achievements') || 0)

    this.setData({
      userInfo,
      signDays,
      points,
      achievements
    })
  },

  async loadUserTitles() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserTitles',
        data: {}
      })

      if (result.result.success) {
        const equippedTitles = result.result.data.equippedTitles || []
        const allTitles = result.result.data.allTitles || []
        const equippedIds = new Set(equippedTitles.map(item => item.titleId))
        const displayTitles = allTitles.map(item => ({
          ...item,
          isEquipped: equippedIds.has(item.titleId)
        }))

        this.setData({
          displayTitles,
          titleStats: {
            owned: result.result.data.ownedCount || allTitles.length,
            equipped: result.result.data.equippedCount || equippedTitles.length
          }
        })
      }
    } catch (err) {
      console.error('加载用户称号失败：', err)
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
