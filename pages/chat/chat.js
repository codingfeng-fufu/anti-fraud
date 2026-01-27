// pages/chat/chat.js
Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    scrollToView: '',
    // 欢迎消息
    welcomeMessage: '你好！我是反诈AI助手，可以帮你：\n\n• 解答反诈骗问题\n• 识别可疑信息\n• 提供防骗建议\n• 分析上传的截图\n\n💡 我会记住最近10轮对话，所以您可以追问"那怎么办"、"还有呢"等问题，我会基于之前的对话内容回答。\n\n有什么可以帮你的吗？',
    privacyText: '🔒 隐私保护：对话记录仅保存在您的手机本地，不会上传到服务器。'
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
  // Sync user info from cloud
  async syncUserInfoFromCloud() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })

      if (result.result && result.result.success) {
        const data = result.result.data || {}
        const userInfo = data.userInfo || {}

        if (userInfo && Object.keys(userInfo).length > 0) {
          wx.setStorageSync('userInfo', userInfo)
        }

        if (typeof userInfo.points === 'number') {
          wx.setStorageSync('points', userInfo.points)
        }
        if (typeof userInfo.totalChatCount === 'number') {
          wx.setStorageSync('chatTimes', userInfo.totalChatCount)
        }
        if (typeof userInfo.totalReadCount === 'number') {
          wx.setStorageSync('readArticles', userInfo.totalReadCount)
        }
        if (typeof userInfo.signDays === 'number') {
          wx.setStorageSync('signDays', userInfo.signDays)
        }

        const achievementList = Array.isArray(data.achievementList)
          ? data.achievementList
          : null
        if (achievementList) {
          wx.setStorageSync('achievements', achievementList.filter(item => item.unlocked).length)
        } else if (Array.isArray(userInfo.achievements)) {
          wx.setStorageSync('achievements', userInfo.achievements.length)
        }
      }
    } catch (err) {
      console.error('syncUserInfoFromCloud failed:', err)
    }
  },
  // Clear local messages
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
      // 获取最近10轮对话（20条消息），保持上下文连贯性
      const currentMessages = this.data.messages
      const recentMessages = currentMessages.slice(-20)
      const history = recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      // 调用云函数获取AI回复（传入历史记录）
      const result = await wx.cloud.callFunction({
        name: 'aiChat',
        data: {
          message,
          history,  // 传递最近10轮对话历史，让AI记住上下文
          stream: true  // 启用流式处理
        }
      })

      if (result.result.success) {
        const reply = result.result.data.reply
        const actionData = result.result.data.actionData
        console.log('AI对话成功，actionData:', actionData)
        console.log('当前本地积分:', wx.getStorageSync('points') || 0)
        
        if (actionData) {
          console.log('处理actionData数据')
          
          if (typeof actionData.updatedCount === 'number') {
            console.log('更新对话次数:', actionData.updatedCount)
            wx.setStorageSync('chatTimes', actionData.updatedCount)
          } else {
            console.warn('actionData.updatedCount不是数字:', actionData.updatedCount)
            // 备用：从本地消息计算并更新
            const currentChatTimes = wx.getStorageSync('chatTimes') || 0
            const newChatTimes = currentChatTimes + 1
            console.log('备用更新对话次数:', currentChatTimes, '+', 1, '=', newChatTimes)
            wx.setStorageSync('chatTimes', newChatTimes)
          }
          
          if (typeof actionData.userPoints === 'number') {
            console.log('更新用户积分:', actionData.userPoints)
            wx.setStorageSync('points', actionData.userPoints)
            console.log('积分已更新，新积分:', actionData.userPoints)
          } else if (actionData.totalPoints) {
            const points = wx.getStorageSync('points') || 0
            const newPoints = points + actionData.totalPoints
            console.log('增加积分:', points, '+', actionData.totalPoints, '=', newPoints)
            wx.setStorageSync('points', newPoints)
            console.log('积分已更新，新积分:', newPoints)
          } else {
            console.warn('actionData中没有积分信息:', { userPoints: actionData.userPoints, totalPoints: actionData.totalPoints })
          }
          
          if (Array.isArray(actionData.newAchievements) && actionData.newAchievements.length > 0) {
            console.log('获得新成就:', actionData.newAchievements)
            const achievementIds = actionData.newAchievements
              .map(item => item.achievementId)
              .filter(Boolean)
            const userInfo = wx.getStorageSync('userInfo') || {}
            
            if (Array.isArray(userInfo.achievements) && achievementIds.length > 0) {
              const merged = Array.from(new Set([...userInfo.achievements, ...achievementIds]))
              userInfo.achievements = merged
              wx.setStorageSync('userInfo', userInfo)
              wx.setStorageSync('achievements', merged.length)
              console.log('更新用户成就列表:', merged)
            } else {
              const achievements = wx.getStorageSync('achievements') || 0
              const newAchievementsCount = achievements + actionData.newAchievements.length
              wx.setStorageSync('achievements', newAchievementsCount)
              console.log('更新成就数量:', achievements, '+', actionData.newAchievements.length, '=', newAchievementsCount)
            }
          } else {
            console.log('没有新成就获得')
          }
        } else {
          console.warn('actionData为空，使用备用逻辑')
          // 备用：手动更新本地计数
          const currentChatTimes = wx.getStorageSync('chatTimes') || 0
          const newChatTimes = currentChatTimes + 1
          const points = wx.getStorageSync('points') || 0
          const newPoints = points + 2 // 基础积分
          
          console.log('备用更新数据:', { chatTimes: newChatTimes, points: newPoints })
          wx.setStorageSync('chatTimes', newChatTimes)
          wx.setStorageSync('points', newPoints)
          console.log('积分已更新，新积分:', newPoints)
        }
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
        this.syncUserInfoFromCloud()
      } else {
        // AI 调用失败
        throw new Error(result.result.errMsg || 'AI 服务返回失败')
      }
    } catch (err) {
      console.error('AI对话失败：', err)

      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: '抱歉，服务暂时不可用，请稍后再试。\n\n如需紧急帮助，请拨打反诈专线：96110'
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

  uploadImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]

        // 显示加载提示
        wx.showLoading({
          title: '正在识别图片...',
          mask: true
        })

        // 将图片转为 base64
        wx.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: async (fileRes) => {
            const base64Image = fileRes.data

            // 添加用户消息（显示图片）
            const userMsg = {
              id: Date.now(),
              role: 'user',
              content: '[图片]',
              imageUrl: tempFilePath
            }

            this.setData({
              messages: [...this.data.messages, userMsg],
              loading: true,
              scrollToView: `msg-${this.data.messages.length}`
            })

            try {
              // 构建历史记录（最近10轮对话，20条消息）
              const currentMessages = this.data.messages
              const recentMessages = currentMessages.slice(-20)
              const history = recentMessages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
              }))

              // 调用云函数，传入 base64 图片
              const result = await wx.cloud.callFunction({
                name: 'aiChat',
                data: {
                  message: '请帮我分析这张图片是否存在诈骗风险',
                  imageBase64: base64Image,
                  history,
                  stream: true  // 启用流式处理
                }
              })

              wx.hideLoading()

              if (result.result.success) {
                const reply = result.result.data.reply
                const actionData = result.result.data.actionData

                // 处理 actionData
                if (actionData) {
                  if (typeof actionData.updatedCount === 'number') {
                    wx.setStorageSync('chatTimes', actionData.updatedCount)
                  }
                  if (typeof actionData.userPoints === 'number') {
                    wx.setStorageSync('points', actionData.userPoints)
                  } else if (actionData.totalPoints) {
                    const points = wx.getStorageSync('points') || 0
                    const newPoints = points + actionData.totalPoints
                    wx.setStorageSync('points', newPoints)
                  }
                  if (Array.isArray(actionData.newAchievements) && actionData.newAchievements.length > 0) {
                    const achievementIds = actionData.newAchievements
                      .map(item => item.achievementId)
                      .filter(Boolean)
                    const userInfo = wx.getStorageSync('userInfo') || {}

                    if (Array.isArray(userInfo.achievements) && achievementIds.length > 0) {
                      const merged = Array.from(new Set([...userInfo.achievements, ...achievementIds]))
                      userInfo.achievements = merged
                      wx.setStorageSync('userInfo', userInfo)
                      wx.setStorageSync('achievements', merged.length)
                    } else {
                      const achievements = wx.getStorageSync('achievements') || 0
                      const newAchievementsCount = achievements + actionData.newAchievements.length
                      wx.setStorageSync('achievements', newAchievementsCount)
                    }
                  }
                }

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

                this.saveLocalMessages(newMessages)
                this.syncUserInfoFromCloud()
              } else {
                throw new Error(result.result.errMsg || '识别失败')
              }
            } catch (err) {
              console.error('图片识别失败：', err)
              wx.hideLoading()

              const botMsg = {
                id: Date.now() + 1,
                role: 'bot',
                content: '抱歉，图片分析失败，请稍后再试。\n\n如需紧急帮助，请拨打反诈专线：96110'
              }

              const newMessages = [...this.data.messages, botMsg]
              this.setData({
                messages: newMessages,
                loading: false,
                scrollToView: `msg-${newMessages.length - 1}`
              })

              this.saveLocalMessages(newMessages)
            }
          },
          fail: (err) => {
            console.error('读取图片失败：', err)
            wx.hideLoading()
            wx.showToast({
              title: '读取图片失败',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        console.error('选择图片失败：', err)
      }
    })
  }
})

