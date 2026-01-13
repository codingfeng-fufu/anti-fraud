// pages/settings/settings.js
Page({
  data: {
    settings: {
      notifications: true,
      sound: true,
      vibrate: false,
      autoLogin: true
    },
    version: '1.0.0'
  },

  onLoad() {
    this.loadSettings()
  },

  loadSettings() {
    try {
      const settings = wx.getStorageSync('appSettings') || this.data.settings
      this.setData({ settings })
    } catch (e) {
      console.error('加载设置失败：', e)
    }
  },

  // 切换开关
  toggleSwitch(e) {
    const key = e.currentTarget.dataset.key
    const value = e.detail.value
    
    this.setData({
      [`settings.${key}`]: value
    })
    
    // 保存设置
    try {
      wx.setStorageSync('appSettings', this.data.settings)
      wx.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 1000
      })
    } catch (e) {
      console.error('保存设置失败：', e)
    }
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '清除缓存后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync()
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/index/index'
              })
            }, 1500)
          } catch (e) {
            console.error('清除缓存失败：', e)
          }
        }
      }
    })
  },

  // 检查更新
  checkUpdate() {
    wx.showLoading({ title: '检查中...' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '当前已是最新版本',
        icon: 'none'
      })
    }, 1000)
  },

  goBack() {
    wx.navigateBack()
  }
})
