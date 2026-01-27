Page({
  data: {
    equippedTitles: [], // 当前佩戴的称号
    ownedTitles: []     // 已获得的称号
  },

  onLoad() {
    this.loadUserTitles()
  },

  onShow() {
    this.loadUserTitles()
  },

  // 加载用户称号数据
  async loadUserTitles() {
    wx.showLoading({
      title: '加载中...'
    })

    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserTitles',
        data: {}
      })

      if (result.result.success) {
        this.setData({
          equippedTitles: result.result.data.equippedTitles || [],
          ownedTitles: result.result.data.allTitles || []
        })
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        })
      }
    } catch (err) {
      console.error('加载用户称号失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 佩戴称号
  async equipTitle(e) {
    const titleId = e.currentTarget.dataset.id

    wx.showLoading({
      title: '佩戴中...'
    })

    try {
      const result = await wx.cloud.callFunction({
        name: 'equipTitle',
        data: {
          titleId,
          action: 'equip'
        }
      })

      if (result.result.success) {
        wx.showToast({
          title: '佩戴成功',
          icon: 'success'
        })

        // 重新加载数据
        this.loadUserTitles()
      } else {
        wx.showToast({
          title: result.result.errMsg || '佩戴失败',
          icon: 'error'
        })
      }
    } catch (err) {
      console.error('佩戴称号失败：', err)
      wx.showToast({
        title: '佩戴失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 卸下称号
  async unequipTitle(e) {
    const titleId = e.currentTarget.dataset.id

    wx.showLoading({
      title: '卸下中...'
    })

    try {
      const result = await wx.cloud.callFunction({
        name: 'equipTitle',
        data: {
          titleId,
          action: 'unequip'
        }
      })

      if (result.result.success) {
        wx.showToast({
          title: '卸下成功',
          icon: 'success'
        })

        // 重新加载数据
        this.loadUserTitles()
      } else {
        wx.showToast({
          title: result.result.errMsg || '卸下失败',
          icon: 'error'
        })
      }
    } catch (err) {
      console.error('卸下称号失败：', err)
      wx.showToast({
        title: '卸下失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 检查称号是否已佩戴
  isEquipped(titleId) {
    return this.data.equippedTitles.some(title => title.titleId === titleId)
  },

  // 删除称号
  async deleteTitle(e) {
    const titleId = e.currentTarget.dataset.id

    wx.showLoading({
      title: '删除中...'
    })

    try {
      const result = await wx.cloud.callFunction({
        name: 'deleteTitle',
        data: {
          titleId
        }
      })

      if (result.result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })

        // 重新加载数据
        this.loadUserTitles()
      } else {
        wx.showToast({
          title: result.result.errMsg || '删除失败',
          icon: 'error'
        })
      }
    } catch (err) {
      console.error('删除称号失败：', err)
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})
