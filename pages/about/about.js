// pages/about/about.js
Page({
  data: {
    appInfo: {
      name: '反诈卫士',
      version: '1.2',
      releaseDate: '2026-01-27',
      description: '面向大学生的反诈骗宣传教育小程序'
    },
    
    features: [
      { icon: '📰', title: '反诈资讯', desc: '及时了解最新诈骗手段和防范知识' },
      { icon: '🤖', title: 'AI助手', desc: '智能识别诈骗套路，提供专业建议' },
      { icon: '🎯', title: '每日签到', desc: '养成学习习惯，获取积分奖励' },
      { icon: '🏆', title: '成就系统', desc: '解锁成就徽章，记录学习成长' }
    ],
    
    team: [
      { role: '产品经理', name: '张三' },
      { role: '开发工程师', name: '李四' },
      { role: 'UI设计师', name: '王五' },
      { role: '内容运营', name: '赵六' }
    ],
    
    contact: {
      email: 'plk161211@163.com',
      wechat: 'antiscam_helper',
      hotline: '96110'
    }
  },

  // 复制联系方式
  copyContact(e) {
    const text = e.currentTarget.dataset.text
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
