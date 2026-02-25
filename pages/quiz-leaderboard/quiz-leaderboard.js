/**
 * 答题排行榜页面 - 趣味答题模块 (v3)
 *
 * 上游依赖：云函数(getQuizLeaderboard)
 * 入口：页面 onLoad
 * 主要功能：展示排行榜
 * 输出：排行榜列表
 *
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

Page({
  data: {
    list: []
  },

  onLoad() {
    this.refresh()
  },

  async refresh() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getQuizLeaderboard',
        data: { limit: 50 }
      })
      wx.hideLoading()
      if (res.result && res.result.success) {
        this.setData({ list: res.result.data.list || [] })
      } else {
        wx.showToast({ title: res.result?.errMsg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('getQuizLeaderboard failed:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  goProfile(e) {
    const uid = e.currentTarget.dataset.uid
    if (!uid) return
    wx.navigateTo({ url: `/pages/profile/profile?uid=${uid}` })
  },

  goBack() {
    wx.navigateBack()
  }
})

