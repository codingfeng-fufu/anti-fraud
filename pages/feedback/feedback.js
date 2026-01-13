// pages/feedback/feedback.js
Page({
  data: {
    currentTab: 'help', // help, feedback
    feedbackContent: '',
    contactInfo: '',
    
    // 常见问题
    faqs: [
      {
        q: '如何每日签到？',
        a: '进入"我的"页面，点击"每日签到"按钮即可完成签到，每天可获得10积分。'
      },
      {
        q: 'AI助手如何使用？',
        a: '点击底部"AI助手"tab，输入您的问题，AI会为您解答反诈骗相关咨询。'
      },
      {
        q: '积分有什么用？',
        a: '积分可以在积分商城兑换礼品、道具卡等虚拟或实体商品。'
      },
      {
        q: '如何查看学习记录？',
        a: '进入"我的"页面，点击"学习记录"可查看阅读历史和AI对话记录。'
      },
      {
        q: '遇到诈骗怎么办？',
        a: '立即拨打110报警或96110反诈专线，保留证据并冻结相关账户。'
      }
    ]
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  onFeedbackInput(e) {
    this.setData({ feedbackContent: e.detail.value })
  },

  onContactInput(e) {
    this.setData({ contactInfo: e.detail.value })
  },

  submitFeedback() {
    const { feedbackContent, contactInfo } = this.data
    
    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请填写反馈内容',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '提交中...' })
    
    // TODO: 提交到云数据库
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })
      this.setData({
        feedbackContent: '',
        contactInfo: ''
      })
    }, 1000)
  },

  goBack() {
    wx.navigateBack()
  }
})
