// pages/bind-student/bind-student.js
Page({
  data: {
    // 表单数据
    studentId: '',
    realName: '',
    phone: '',
    grade: '',
    
    // 固定学校信息
    schoolInfo: {
      schoolId: 'CUFE',
      schoolName: '中央财经大学',
      province: '北京市',
      city: '北京市',
      studentIdPattern: '\\d{10}',
      studentIdExample: '2023010001'
    },
    
    // 选择器数据
    colleges: [
      { collegeId: 'FIN', collegeName: '金融学院' },
      { collegeId: 'ACC', collegeName: '会计学院' },
      { collegeId: 'ECO', collegeName: '经济学院' },
      { collegeId: 'BUS', collegeName: '商学院' },
      { collegeId: 'TAX', collegeName: '财政税务学院' },
      { collegeId: 'LAW', collegeName: '法学院' },
      { collegeId: 'INS', collegeName: '保险学院' },
      { collegeId: 'STAT', collegeName: '统计与数学学院' },
      { collegeId: 'IT', collegeName: '信息学院' },
      { collegeId: 'COMM', collegeName: '文化与传媒学院' }
    ],
    majors: [],
    grades: ['2024级', '2023级', '2022级', '2021级', '2020级'],
    
    // 选中项
    selectedCollege: null,
    selectedMajor: null,
    
    // 索引
    collegeIndex: 0,
    majorIndex: 0,
    gradeIndex: 0,
    
    // 提示
    studentIdPlaceholder: '请输入10位学号，如：2023010001'
  },

  onLoad(options) {
    // 不需要加载学校列表了
  },


  // 选择院系
  onCollegeChange(e) {
    const index = e.detail.value
    const college = this.data.colleges[index]
    
    this.setData({
      collegeIndex: index,
      selectedCollege: college
    })
  },


  // 选择年级
  onGradeChange(e) {
    const index = e.detail.value
    this.setData({
      gradeIndex: index,
      grade: this.data.grades[index]
    })
  },

  // 输入学号
  onStudentIdInput(e) {
    this.setData({
      studentId: e.detail.value.trim()
    })
  },

  // 输入姓名
  onRealNameInput(e) {
    this.setData({
      realName: e.detail.value.trim()
    })
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value.trim()
    })
  },

  // 提交绑定
  async handleSubmit() {
    // 验证必填项
    if (!this.data.studentId) {
      wx.showToast({
        title: '请输入学号',
        icon: 'none'
      })
      return
    }
    
    // 验证学号格式（10位数字）
    if (!/^\d{10}$/.test(this.data.studentId)) {
      wx.showToast({
        title: '学号必须是10位数字',
        icon: 'none'
      })
      return
    }
    
    // 验证手机号格式（如果填写）
    if (this.data.phone && !/^1[3-9]\d{9}$/.test(this.data.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '提交中...' })
    
    try {
      // 调用云函数绑定
      const result = await wx.cloud.callFunction({
        name: 'bindStudent',
        data: {
          studentId: this.data.studentId,
          realName: this.data.realName,
          schoolId: this.data.schoolInfo.schoolId,
          schoolName: this.data.schoolInfo.schoolName,
          collegeId: this.data.selectedCollege?.collegeId,
          collegeName: this.data.selectedCollege?.collegeName,
          grade: this.data.grade,
          phone: this.data.phone
        }
      })
      
      wx.hideLoading()
      
if (result.result.success) {
        const data = result.result.data
        
        // 更新本地存储的积分
        if (data.userInfo && typeof data.userInfo.points === 'number') {
          wx.setStorageSync('points', data.userInfo.points)
          console.log('绑定成功，更新积分:', data.userInfo.points)
        }
        
        // 更新本地存储的用户信息
        if (data.userInfo) {
          wx.setStorageSync('userInfo', data.userInfo)
        }
        
        // 显示成功提示
        let content = result.result.message || '绑定成功！'
        if (data.isFirstBind && data.rewardPoints > 0) {
          content += `\n恭喜获得 ${data.rewardPoints} 积分奖励！`
        }
        
        wx.showModal({
          title: '绑定成功 ✨',
          content,
          showCancel: false,
          success: () => {
            // 返回上一页或跳转到首页
            wx.switchTab({
              url: '/pages/user/user'
            })
          }
        })
      } else {
        wx.showModal({
          title: '绑定失败',
          content: result.result.errMsg || '请重试',
          showCancel: false
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('绑定失败：', err)
      wx.showModal({
        title: '绑定失败',
        content: err.errMsg || err.message || '网络错误',
        showCancel: false
      })
    }
  }
})

