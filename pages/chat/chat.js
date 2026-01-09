// pages/chat/chat.js
Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    scrollToView: ''
  },

  onLoad(options) {
    // 🔒 从本地存储加载历史记录
    this.loadLocalMessages()
  },

  onShow() {
    // 每次显示页面时刷新滚动位置
    if (this.data.messages.length > 0) {
      this.setData({
        scrollToView: `msg-${this.data.messages.length - 1}`
      })
    }
  },

  // 从本地存储加载消息
  loadLocalMessages() {
    try {
      const localMessages = wx.getStorageSync('chat_messages')
      if (localMessages && localMessages.length > 0) {
        this.setData({
          messages: localMessages,
          scrollToView: `msg-${localMessages.length - 1}`
        })
        console.log(`已加载 ${localMessages.length} 条本地消息`)
      }
    } catch (err) {
      console.error('加载本地消息失败：', err)
    }
  },

  // 保存消息到本地存储
  saveLocalMessages(messages) {
    try {
      // 最多保存最近100条消息（避免占用太多空间）
      const messagesToSave = messages.slice(-100)
      wx.setStorageSync('chat_messages', messagesToSave)
      console.log(`已保存 ${messagesToSave.length} 条消息到本地`)
    } catch (err) {
      console.error('保存本地消息失败：', err)
    }
  },

  // 清除本地历史记录
  clearLocalMessages() {
    wx.showModal({
      title: '清除历史记录',
      content: '确定要清除所有对话记录吗？此操作不可恢复。',
      confirmText: '清除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('chat_messages')
            this.setData({ messages: [] })
            wx.showToast({
              title: '已清除历史记录',
              icon: 'success'
            })
          } catch (err) {
            console.error('清除失败：', err)
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  async sendMessage() {
    const message = this.data.inputValue.trim()
    if (!message) {
      wx.showToast({
        title: '请输入消息',
        icon: 'none'
      })
      return
    }

    // 添加用户消息
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: message
    }

    this.setData({
      messages: [...this.data.messages, userMsg],
      inputValue: '',
      loading: true,
      scrollToView: `msg-${this.data.messages.length}`
    })

    try {
      // 🔒 隐私保护：构建历史记录（仅保存在内存中）
      // 获取最近5轮对话（10条消息），保持上下文连贯性
      const currentMessages = this.data.messages
      const recentMessages = currentMessages.slice(-10)
      const history = recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      // 调用云函数获取AI回复（传入历史记录）
      const result = await wx.cloud.callFunction({
        name: 'aiChat',
        data: {
          message,
          history  // 传递最近5轮对话历史，让AI记住上下文
        }
      })

      if (result.result.success) {
        const reply = result.result.data.reply
        const botMsg = {
          id: Date.now() + 1,
          role: 'bot',
          content: reply
        }

        const newMessages = [...this.data.messages, botMsg]
        this.setData({
          messages: newMessages,
          loading: false,
          scrollToView: `msg-${newMessages.length - 1}`
        })

        // 🔒 保存到本地存储
        this.saveLocalMessages(newMessages)
      } else {
        // 失败时使用本地回复
        const reply = this.generateReply(message)
        const botMsg = {
          id: Date.now() + 1,
          role: 'bot',
          content: reply
        }

        const newMessages = [...this.data.messages, botMsg]
        this.setData({
          messages: newMessages,
          loading: false,
          scrollToView: `msg-${newMessages.length - 1}`
        })

        // 🔒 保存到本地存储
        this.saveLocalMessages(newMessages)
      }
    } catch (err) {
      console.error('AI对话失败：', err)
      // 失败时使用本地回复
      const reply = this.generateReply(message)
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: reply
      }

      const newMessages = [...this.data.messages, botMsg]
      this.setData({
        messages: newMessages,
        loading: false,
        scrollToView: `msg-${newMessages.length - 1}`
      })

      // 🔒 保存到本地存储
      this.saveLocalMessages(newMessages)
    }
  },

  generateReply(message) {
    // 根据关键词生成回复
    if (message.includes('诈骗') || message.includes('骗子') || message.includes('骗')) {
      return '根据您的描述，这确实存在诈骗风险。常见的诈骗特征包括：\n\n1. 要求转账或提供银行卡信息\n2. 承诺高额回报\n3. 催促您快速决定\n\n建议您立即停止与对方联系，如有损失请及时报警（96110）。'
    } else if (message.includes('投资') || message.includes('理财')) {
      return '投资理财类诈骗是当前最常见的诈骗类型之一。请注意：\n\n• 警惕"保本高收益"的承诺\n• 在正规金融平台投资\n• 不轻信陌生人推荐\n• 投资前做好背景调查\n\n需要我详细介绍某种投资骗局吗？'
    } else if (message.includes('刷单') || message.includes('兼职')) {
      return '刷单兼职诈骗是针对大学生的常见骗局！\n\n骗局特征：\n• 声称轻松赚钱，日入上千\n• 要求先垫付本金\n• 承诺返还本金+佣金\n\n防范建议：\n✓ 天上不会掉馅饼\n✓ 不要轻信高薪兼职\n✓ 不要垫付任何资金\n\n如果已经被骗，请立即报警！'
    } else if (message.includes('贷款') || message.includes('校园贷')) {
      return '校园贷、培训贷是大学生需要警惕的陷阱！\n\n常见套路：\n• 低门槛，无需抵押\n• 利息极高，滚雪球式增长\n• 暴力催收\n\n正确做法：\n✓ 通过正规银行办理贷款\n✓ 仔细阅读合同条款\n✓ 不要在多个平台借贷\n✓ 量力而行，理性消费'
    } else if (message.includes('你好') || message.includes('您好') || message.includes('hi')) {
      return '你好！很高兴为您服务😊\n\n我可以帮助您：\n• 识别各类诈骗手段\n• 解答防骗相关问题\n• 分析可疑信息\n• 提供安全建议\n\n请告诉我您遇到的具体情况吧！'
    } else {
      return '感谢您的提问！我会尽力帮您解答。\n\n您可以：\n1. 描述遇到的具体情况\n2. 上传可疑信息截图\n3. 询问某种诈骗类型\n\n我会为您提供专业的防骗建议。如需紧急帮助，请拨打反诈专线：96110'
    }
  },

  uploadImage() {
    // 直接提示功能开发中，不调用图片选择
    wx.showModal({
      title: '功能开发中',
      content: '图片识别功能正在开发中，敬请期待！\n\n目前 AI 模型暂不支持图片解析，您可以通过文字描述可疑信息，我会帮您分析。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#0ea5e9'
    })
    
    // TODO: 未来可以集成 OCR 或多模态模型
    // 实现思路：
    // 1. 调用微信 OCR 接口识别图片中的文字
    // 2. 或使用支持图片的多模态 AI 模型（如 Qwen-VL）
    // 3. 将识别结果作为用户消息发送给 AI 分析
  }
})

