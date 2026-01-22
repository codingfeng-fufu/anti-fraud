/**
 * 每日签到页面 - 签到日历模块
 * 
 * 上游依赖：云函数(userSignIn)，本地缓存(signDays, points, lastSignDate)
 * 入口：页面onLoad/onShow生命周期
 * 主要功能：展示签到日历、自动触发今日签到、同步签到数据
 * 输出：更新页面数据与本地缓存，触发签到交互提示
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */
// pages/sign-in/sign-in.js
Page({
  data: {
    signDays: 0,
    points: 0,
    todaySigned: false,
    calendarDays: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    currentMonthLabel: '',
    isSigning: false
  },

  onLoad() {
    this.refreshState()
    this.buildCalendar()
    this.autoSignIn()
  },

  onShow() {
    this.refreshState()
    this.buildCalendar()
    this.autoSignIn()
  },

  refreshState() {
    const signDays = wx.getStorageSync('signDays') || 0
    const points = wx.getStorageSync('points') || 0
    const todaySigned = this.checkTodaySigned()

    this.setData({
      signDays,
      points,
      todaySigned
    })
  },

  getLastSignDate() {
    let lastSignDate = wx.getStorageSync('lastSignDate') || ''
    if (lastSignDate && lastSignDate.includes('T')) {
      lastSignDate = lastSignDate.split('T')[0]
      wx.setStorageSync('lastSignDate', lastSignDate)
    }

    if (!lastSignDate) return null

    const parts = lastSignDate.split('-').map(Number)
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null
    return new Date(parts[0], parts[1] - 1, parts[2])
  },

  getBeijingDate() {
    const now = new Date()
    return new Date(now.getTime() + (8 * 60 * 60 * 1000))
  },

  checkTodaySigned() {
    let lastSignDate = wx.getStorageSync('lastSignDate') || ''

    if (lastSignDate && lastSignDate.includes('T')) {
      lastSignDate = lastSignDate.split('T')[0]
      wx.setStorageSync('lastSignDate', lastSignDate)
    }

    const beijingTime = this.getBeijingDate()
    const today = beijingTime.toISOString().split('T')[0]
    return lastSignDate === today
  },

  buildCalendar() {
    const now = this.getBeijingDate()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1)
    const startWeekday = firstDay.getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const currentMonthLabel = `${year}年${String(month + 1).padStart(2, '0')}月`

    const lastSignDate = this.getLastSignDate()
    const signDays = this.data.signDays || 0
    let startSignDate = null

    if (lastSignDate && signDays > 0) {
      startSignDate = new Date(lastSignDate)
      startSignDate.setDate(startSignDate.getDate() - signDays + 1)
    }

    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const calendarDays = []

    for (let i = 0; i < startWeekday; i += 1) {
      calendarDays.push({ day: '', isPlaceholder: true })
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day)
      const isToday = date.getTime() === todayDate.getTime()
      let isSigned = false

      if (startSignDate && lastSignDate) {
        isSigned = date >= startSignDate && date <= lastSignDate
      }

      calendarDays.push({
        day,
        isPlaceholder: false,
        isToday,
        isSigned
      })
    }

    this.setData({
      calendarDays,
      currentMonthLabel
    })
  },

  autoSignIn() {
    if (this.data.todaySigned || this.data.isSigning) {
      return
    }

    this.doSignIn(true)
  },

  handleSignIn() {
    this.doSignIn(false)
  },

  async doSignIn(isAuto) {
    const todaySigned = this.checkTodaySigned()

    if (todaySigned) {
      this.setData({ todaySigned: true })
      if (!isAuto) {
        wx.showToast({
          title: '今天已签到',
          icon: 'none'
        })
      }
      return
    }

    if (this.data.isSigning) return
    this.setData({ isSigning: true })

    const showLoading = !isAuto
    if (showLoading) {
      wx.showLoading({ title: '签到中...' })
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'userSignIn',
        data: {}
      })

      if (showLoading) {
        wx.hideLoading()
      }

      if (result.result && result.result.success) {
        const data = result.result.data || {}
        const signDays = data.signDays ?? this.data.signDays
        const points = data.points ?? this.data.points
        const achievementPoints = data.achievementPoints || 0

        this.setData({
          signDays,
          points,
          todaySigned: true
        })

        wx.setStorageSync('signDays', signDays)
        wx.setStorageSync('points', points)
        if (data.lastSignDate) {
          wx.setStorageSync('lastSignDate', data.lastSignDate)
        }

        this.buildCalendar()

        if (isAuto) {
          wx.showToast({
            title: achievementPoints ? `自动签到+${achievementPoints}` : '已自动签到',
            icon: 'success'
          })
        } else {
          let content = result.result.message || `连续签到${signDays}天，获得${data.earnedPoints || 0}积分`
          if (achievementPoints) {
            content += `\n成就奖励 +${achievementPoints} 积分`
          }
          wx.showModal({
            title: '签到成功',
            content,
            showCancel: false,
            confirmText: '知道了'
          })
        }
      } else {
        const errMsg = result.result?.errMsg || '签到失败'
        if (!isAuto) {
          wx.showToast({
            title: errMsg,
            icon: 'none'
          })
        }
      }
    } catch (err) {
      if (showLoading) {
        wx.hideLoading()
      }
      console.error('签到失败：', err)
      if (!isAuto) {
        wx.showToast({
          title: '签到失败，请重试',
          icon: 'none'
        })
      }
    } finally {
      this.setData({ isSigning: false })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
