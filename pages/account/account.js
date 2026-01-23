Page({
  data: {
    userInfo: {}
  },

  onLoad() {
    this.loadUserData()
  },

  onShow() {
    this.loadUserData()
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({
      userInfo
    })
  },

  async loadUserDataFromCloud() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })

      if (result.result.success) {
        const userInfo = result.result.data.userInfo
        this.setData({
          userInfo
        })
        wx.setStorageSync('userInfo', userInfo)
      }
    } catch (err) {
      console.error('加载用户数据失败：', err)
    }
  },

  editNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      content: this.data.userInfo.nickName || '',
      success: async (res) => {
        if (res.confirm && res.content) {
          const newNickname = res.content.trim()
          if (newNickname.length < 2 || newNickname.length > 20) {
            wx.showToast({
              title: '昵称长度需2-20个字符',
              icon: 'none'
            })
            return
          }
          await this.updateNickname(newNickname)
        }
      }
    })
  },

  async updateNickname(nickName) {
    wx.showLoading({ title: '更新中...' })

    try {
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          nickName: nickName,
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
      } else {
        wx.showToast({
          title: result.result.errMsg || '更新失败',
          icon: 'none'
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

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        await this.uploadAvatar(tempFilePath)
      }
    })
  },

  async uploadAvatar(filePath) {
    wx.showLoading({ title: '上传中...' })

    try {
      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath
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
      } else {
        wx.showToast({
          title: result.result.errMsg || '更新失败',
          icon: 'none'
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

  bindStudent() {
    if (this.data.userInfo.isBound) {
      wx.showToast({
        title: '已绑定学号',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/bind-student/bind-student'
    })
  },

  unbindStudent() {
    wx.showModal({
      title: '确认解绑',
      content: '解绑后将无法使用学生相关功能，确定要继续吗？',
      success: async (res) => {
        if (res.confirm) {
          await this.doUnbindStudent()
        }
      }
    })
  },

  async doUnbindStudent() {
    wx.showLoading({ title: '解绑中...' })

    try {
      const result = await wx.cloud.callFunction({
        name: 'unbindStudent',
        data: {}
      })

      if (result.result.success) {
        this.setData({
          'userInfo.isBound': false,
          'userInfo.studentId': '',
          'userInfo.realName': '',
          'userInfo.schoolId': '',
          'userInfo.schoolName': '',
          'userInfo.collegeId': '',
          'userInfo.collegeName': '',
          'userInfo.majorId': '',
          'userInfo.majorName': '',
          'userInfo.grade': '',
          'userInfo.className': '',
          'userInfo.phone': '',
          'userInfo.isVerified': false,
          'userInfo.verifiedAt': null
        })
        wx.setStorageSync('userInfo', this.data.userInfo)
        wx.showToast({
          title: '解绑成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: result.result.errMsg || '解绑失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('解绑失败：', err)
      wx.showToast({
        title: '解绑失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  goBack() {
    wx.navigateBack()
  }
})